import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Execution } from "@/models/Execution";
import { ExecutionStatus } from "@/types";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Malformed callback body" }, { status: 400 });
    }

    // Extract execution identifier from extra_params or queue id
    let targetExecutionId: string | null = null;
    if (body.extra_params) {
      if (typeof body.extra_params === "object" && body.extra_params !== null) {
        const ep = body.extra_params as Record<string, unknown>;
        if (typeof ep.executionId === "string") {
          targetExecutionId = ep.executionId;
        }
      } else if (typeof body.extra_params === "string") {
        try {
          const parsed = JSON.parse(body.extra_params);
          if (parsed && typeof parsed.executionId === "string") {
            targetExecutionId = parsed.executionId;
          }
        } catch {
          targetExecutionId = body.extra_params;
        }
      }
    }

    const queueId = body.id;

    await connectToDatabase();

    // Query by executionId if present, else by queueId
    let execution = null;
    if (targetExecutionId) {
      execution = await Execution.findOne({ executionId: targetExecutionId });
    }
    if (!execution && queueId !== undefined && queueId !== null) {
      execution = await Execution.findOne({ queueId });
    }

    if (!execution) {
      return NextResponse.json(
        { error: "Execution record not found" },
        { status: 404 }
      );
    }

    // Idempotency: Handle duplicate callbacks safely without re-processing
    const terminalStates: ExecutionStatus[] = [
      "success",
      "error",
      "timeout",
      "failed",
      "cancelled",
    ];

    if (terminalStates.includes(execution.status)) {
      return NextResponse.json(
        {
          success: true,
          executionId: execution.executionId,
          message: "Execution already completed. Callback ignored.",
        },
        { status: 200 }
      );
    }

    // Map OnlineCompiler status to terminal status
    const rawStatus = typeof body.status === "string" ? body.status.toLowerCase().trim() : "";
    const stdout = typeof body.output === "string" ? body.output : typeof body.stdout === "string" ? body.stdout : "";
    const stderr = typeof body.error === "string" ? body.error : typeof body.stderr === "string" ? body.stderr : "";
    const output = stdout || stderr;

    const isTimeout =
      rawStatus === "timeout" ||
      stderr.toLowerCase().includes("timed out") ||
      stderr.toLowerCase().includes("timeout");

    let finalStatus: ExecutionStatus = "success";
    if (isTimeout) {
      finalStatus = "timeout";
    } else if (rawStatus === "failed") {
      finalStatus = "failed";
    } else if (rawStatus === "cancelled") {
      finalStatus = "cancelled";
    } else if (rawStatus === "error" || (body.exit_code !== undefined && body.exit_code !== 0 && body.exit_code !== null) || stderr) {
      finalStatus = "error";
    }

    // Determine compilation error vs runtime error
    let compilationError: string | undefined = undefined;
    let runtimeError: string | undefined = undefined;

    if (finalStatus === "error") {
      const errLower = stderr.toLowerCase();
      if (
        errLower.includes("syntaxerror") ||
        errLower.includes("compilation error") ||
        errLower.includes("error: ") ||
        execution.compiler.includes("gcc") ||
        execution.compiler.includes("g++") ||
        execution.compiler.includes("openjdk")
      ) {
        compilationError = stderr || "Compilation failed";
      } else {
        runtimeError = stderr || "Runtime error";
      }
    }

    execution.status = finalStatus;
    execution.stdout = stdout;
    execution.stderr = stderr;
    execution.output = output;
    execution.exitCode = typeof body.exit_code === "number" ? body.exit_code : null;
    execution.signal = typeof body.signal === "string" ? body.signal : null;
    execution.time = typeof body.time === "string" ? body.time : null;
    execution.memory = typeof body.memory === "string" ? body.memory : null;
    execution.isTimeout = isTimeout;
    execution.compilationError = compilationError;
    execution.runtimeError = runtimeError;

    await execution.save();

    return NextResponse.json({
      success: true,
      executionId: execution.executionId,
      status: execution.status,
    });
  } catch (error) {
    console.error("Callback processing error:", error);
    return NextResponse.json(
      { error: "Internal callback error" },
      { status: 500 }
    );
  }
}
