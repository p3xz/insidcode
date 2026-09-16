import { connectToDatabase } from "@/lib/mongodb";
import { Execution } from "@/models/Execution";
import { executeCodeOnlineCompilerSync, resolveCompilerId } from "@/lib/onlinecompiler";
import { ExecutionStatus } from "@/types";
import crypto from "crypto";

// Safely parse configurable concurrency
export function getMaxConcurrentExecutions(): number {
  const val = process.env.MAX_CONCURRENT_EXECUTIONS;
  if (val) {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 4; // Safe default concurrency value
}

export function getMaxQueueCapacity(): number {
  const val = process.env.MAX_QUEUE_CAPACITY;
  if (val) {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 100; // Default queue capacity
}

const STALE_RUNNING_TIMEOUT_MS = 45 * 1000; // 45 seconds
const MAX_QUEUE_WAIT_MS = 5 * 60 * 1000;    // 5 minutes

/**
 * Returns the number of actively running executions across all serverless instances.
 */
export async function getActiveRunningCount(): Promise<number> {
  await connectToDatabase();
  const cutoff = new Date(Date.now() - STALE_RUNNING_TIMEOUT_MS);
  return await Execution.countDocuments({
    status: "running",
    updatedAt: { $gte: cutoff },
  });
}

/**
 * Returns the 1-indexed FIFO queue position for a given createdAt timestamp.
 */
export async function getQueuePosition(createdAt: Date): Promise<number> {
  await connectToDatabase();
  const aheadCount = await Execution.countDocuments({
    status: "queued",
    createdAt: { $lt: createdAt },
  });
  return aheadCount + 1;
}

export async function createQueuedExecution({
  userId,
  language,
  code,
  input = "",
}: {
  userId: string;
  language: string;
  code: string;
  input?: string;
}): Promise<{ executionId: string; status: ExecutionStatus; queuePosition: number | null }> {
  await connectToDatabase();

  const compilerId = resolveCompilerId(language);
  if (!compilerId) {
    throw new Error(`Unsupported language or compiler: ${language}`);
  }

  // Check queue capacity
  const maxCapacity = getMaxQueueCapacity();
  const currentQueued = await Execution.countDocuments({ status: "queued" });
  if (currentQueued >= maxCapacity) {
    const err = new Error("Execution queue is at maximum capacity. Please wait a moment.");
    (err as unknown as { type: string }).type = "QUEUE_FULL";
    throw err;
  }

  const executionId = `exec_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;

  const execution = await Execution.create({
    executionId,
    userId,
    compiler: compilerId,
    language,
    code,
    input,
    status: "queued",
  });

  const queuePosition = await getQueuePosition(execution.createdAt);

  return {
    executionId,
    status: "queued",
    queuePosition,
  };
}

/**
 * Atomically claims and executes an execution if a concurrency slot is available.
 */
export async function tryClaimAndExecute(executionId: string): Promise<boolean> {
  await connectToDatabase();

  const maxConcurrent = getMaxConcurrentExecutions();
  const runningCount = await getActiveRunningCount();

  if (runningCount >= maxConcurrent) {
    return false; // No available slots
  }

  // Atomically transition from queued -> running
  const execution = await Execution.findOneAndUpdate(
    { executionId, status: "queued" },
    { $set: { status: "running", claimedAt: new Date(), updatedAt: new Date() } },
    { new: true }
  );

  if (!execution) {
    return false; // Already claimed or not queued
  }

  // Dispatch to OnlineCompiler
  try {
    const result = await executeCodeOnlineCompilerSync(
      execution.language,
      execution.code,
      execution.input || ""
    );

    let terminalStatus: ExecutionStatus = "success";
    if (result.isTimeout) {
      terminalStatus = "timeout";
    } else if (result.systemError) {
      terminalStatus = "failed";
    } else if (!result.success) {
      terminalStatus = "error";
    }

    execution.status = terminalStatus;
    execution.stdout = result.stdout;
    execution.stderr = result.stderr;
    execution.output = result.output;
    execution.exitCode = result.code;
    execution.signal = result.signal;
    execution.time = result.time || "";
    execution.memory = result.memory || "";
    execution.compilationError = result.compilationError;
    execution.runtimeError = result.runtimeError;
    execution.isTimeout = Boolean(result.isTimeout);
    execution.systemError = result.systemError;

    await execution.save();
    return true;
  } catch (err: unknown) {
    console.error("Failed to run claimed execution:", err);
    execution.status = "failed";
    execution.systemError = err instanceof Error ? err.message : "Execution failed";
    await execution.save();
    return true;
  }
}

/**
 * Cleans up stale executions that have been queued for too long.
 */
export async function cleanupStaleExecutions(): Promise<void> {
  try {
    await connectToDatabase();
    const staleQueueCutoff = new Date(Date.now() - MAX_QUEUE_WAIT_MS);
    await Execution.updateMany(
      { status: "queued", createdAt: { $lt: staleQueueCutoff } },
      { $set: { status: "expired", systemError: "Queued execution timed out before it could be processed." } }
    );
  } catch (err) {
    console.error("Cleanup stale executions error:", err);
  }
}
