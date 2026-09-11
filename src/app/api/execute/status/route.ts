import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Execution } from "@/models/Execution";
import { executeCodeOnlineCompilerSync } from "@/lib/onlinecompiler";
import { ExecutionStatus } from "@/types";

const TERMINAL_STATES: ExecutionStatus[] = [
  "success",
  "error",
  "timeout",
  "failed",
  "cancelled",
];

export async function GET(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;
    const { searchParams } = new URL(req.url);
    const executionId = searchParams.get("id");

    if (!executionId) {
      return NextResponse.json(
        { error: "Missing required query parameter: id" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const execution = await Execution.findOne({ executionId });
    if (!execution) {
      return NextResponse.json(
        { error: "Execution record not found" },
        { status: 404 }
      );
    }

    // Ownership verification: users can only access their own executions
    if (execution.userId !== user._id.toString()) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this execution" },
        { status: 403 }
      );
    }

    // If already in a terminal state, return result immediately
    if (TERMINAL_STATES.includes(execution.status)) {
      return NextResponse.json({
        executionId: execution.executionId,
        status: execution.status,
        stdout: execution.stdout || "",
        stderr: execution.stderr || "",
        output: execution.output || "",
        exitCode: execution.exitCode,
        isTimeout: execution.isTimeout,
        compilationError: execution.compilationError,
        runtimeError: execution.runtimeError,
        systemError: execution.systemError,
        time: execution.time,
        memory: execution.memory,
      });
    }

    // If still queued/running and webhook hasn't arrived (e.g. in local development or before callback delivery),
    // resolve via sync runner to ensure reliable completion
    try {
      const syncResult = await executeCodeOnlineCompilerSync(
        execution.language,
        execution.code,
        execution.input || ""
      );

      let terminalStatus: ExecutionStatus = "success";
      if (syncResult.isTimeout) {
        terminalStatus = "timeout";
      } else if (syncResult.systemError) {
        terminalStatus = "failed";
      } else if (!syncResult.success) {
        terminalStatus = "error";
      }

      execution.status = terminalStatus;
      execution.stdout = syncResult.stdout;
      execution.stderr = syncResult.stderr;
      execution.output = syncResult.output;
      execution.exitCode = syncResult.code;
      execution.isTimeout = Boolean(syncResult.isTimeout);
      execution.compilationError = syncResult.compilationError;
      execution.runtimeError = syncResult.runtimeError;
      execution.systemError = syncResult.systemError;
      execution.time = syncResult.time;
      execution.memory = syncResult.memory;

      await execution.save();

      return NextResponse.json({
        executionId: execution.executionId,
        status: execution.status,
        stdout: execution.stdout,
        stderr: execution.stderr,
        output: execution.output,
        exitCode: execution.exitCode,
        isTimeout: execution.isTimeout,
        compilationError: execution.compilationError,
        runtimeError: execution.runtimeError,
        systemError: execution.systemError,
        time: execution.time,
        memory: execution.memory,
      });
    } catch (err: unknown) {
      console.error("Status fallback sync error:", err);
      // Return currently recorded status if sync resolution fails
      return NextResponse.json({
        executionId: execution.executionId,
        status: execution.status,
      });
    }
  } catch (error) {
    console.error("Execution status route error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve execution status" },
      { status: 500 }
    );
  }
}
