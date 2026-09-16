import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Execution } from "@/models/Execution";
import { getQueuePosition, tryClaimAndExecute, cleanupStaleExecutions } from "@/lib/executionQueue";

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

    // Clean up stale jobs in background
    cleanupStaleExecutions().catch(() => {});

    let execution = await Execution.findOne({ executionId });
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

    // If still queued, check if a worker slot is now available to claim and execute
    if (execution.status === "queued") {
      const claimedAndRan = await tryClaimAndExecute(execution.executionId);
      if (claimedAndRan) {
        // Refresh execution record from database
        const updated = await Execution.findOne({ executionId });
        if (updated) {
          execution = updated;
        }
      }
    }

    // If still in queued state (all concurrency slots full)
    if (execution.status === "queued") {
      const queuePosition = await getQueuePosition(execution.createdAt);
      return NextResponse.json({
        executionId: execution.executionId,
        status: "queued",
        queuePosition,
      });
    }

    // If actively running
    if (execution.status === "running") {
      return NextResponse.json({
        executionId: execution.executionId,
        status: "running",
      });
    }

    // If expired
    if (execution.status === "expired") {
      return NextResponse.json({
        executionId: execution.executionId,
        status: "expired",
        systemError: execution.systemError || "Execution request expired while queued.",
      });
    }

    // Terminal result
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
  } catch (error) {
    console.error("Execution status route error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve execution status" },
      { status: 500 }
    );
  }
}

