import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  checkExecutionRateLimit,
  acquireExecutionLock,
  releaseExecutionLock,
} from "@/lib/rateLimit";
import { CodeExecutionSchema } from "@/lib/validations";
import { checkUnsupportedHeaders, wrapTurboCCode } from "@/lib/turboc";
import { createQueuedExecution, tryClaimAndExecute, cleanupStaleExecutions } from "@/lib/executionQueue";

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;
    const userId = user._id.toString();

    // Server-side authoritative rate limiting: 10 per 10m, 50 per 1h
    const rateLimit = checkExecutionRateLimit(userId);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: rateLimit.error || "Rate limit exceeded. Please wait before executing again.",
          reset: rateLimit.reset,
        },
        { status: 429 }
      );
    }

    // In-flight lock to prevent duplicate concurrent execution requests from same user
    const lockAcquired = acquireExecutionLock(userId);
    if (!lockAcquired) {
      return NextResponse.json(
        { error: "An execution is already in progress. Please wait for it to complete." },
        { status: 409 }
      );
    }

    try {
      const body = await req.json();
      const parseResult = CodeExecutionSchema.safeParse(body);

      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors[0]?.message || "Invalid execution payload";
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }

      const { language, code, customInput, compat } = parseResult.data;

      // In Turbo C mode, reject unsupported vintage headers before queueing
      if (compat === "turboc" && language === "c") {
        const headerCheck = checkUnsupportedHeaders(code);
        if (headerCheck.unsupported) {
          const errMsg = headerCheck.message || "Turbo C had graphics.h. The internet does not. Try a plain C solution.";
          return NextResponse.json({
            executionId: "exec_header_error_" + Date.now(),
            status: "error",
            stdout: "",
            stderr: errMsg,
            output: errMsg,
            compilationError: errMsg,
            isTurboCMode: true,
          });
        }
      }

      // Wrap code with Turbo C shims if compat is requested for C
      const executionCode = (compat === "turboc" && language === "c") ? wrapTurboCCode(code) : code;

      // Clean up any stale executions in background
      cleanupStaleExecutions().catch(() => {});

      // Create durable queued execution record
      const queuedJob = await createQueuedExecution({
        userId,
        language,
        code: executionCode,
        input: customInput || "",
      });

      // Attempt to immediately claim and start execution if concurrency slot is open
      const claimed = await tryClaimAndExecute(queuedJob.executionId);

      return NextResponse.json(
        {
          executionId: queuedJob.executionId,
          status: claimed ? "running" : "queued",
          queuePosition: claimed ? 1 : queuedJob.queuePosition,
        },
        { status: 202 }
      );
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && (err as { type?: string }).type === "QUEUE_FULL") {
        return NextResponse.json(
          {
            error: "QUEUE_FULL",
            message: "Execution queue is at maximum capacity. Please wait a moment.",
          },
          { status: 429 }
        );
      }
      throw err;
    } finally {
      releaseExecutionLock(userId);
    }
  } catch (error) {
    console.error("Execute route error:", error);
    return NextResponse.json(
      { error: "Code execution service is temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}

