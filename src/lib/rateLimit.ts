interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// In-flight submission tracker: userId -> true while submission is being processed
const inFlightSubmissions = new Set<string>();

// Clean up stale entries every 5 minutes (clean items older than 1 hour)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 3600000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitOptions {
  limit: number; // max requests
  windowMs: number; // in milliseconds
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 30, windowMs: 60000 }
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const key = identifier;
  const windowStart = now - options.windowMs;

  const record = rateLimitStore.get(key) || { timestamps: [] };

  // Filter out timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.limit) {
    const oldestTimestamp = record.timestamps[0];
    const reset = Math.ceil((oldestTimestamp + options.windowMs - now) / 1000);
    return {
      success: false,
      remaining: 0,
      reset: reset > 0 ? reset : 1,
    };
  }

  record.timestamps.push(now);
  rateLimitStore.set(key, record);

  return {
    success: true,
    remaining: options.limit - record.timestamps.length,
    reset: Math.ceil(options.windowMs / 1000),
  };
}

/**
 * Acquires an in-flight lock for a submission.
 * Returns true if the lock was acquired (safe to proceed).
 * Returns false if another submission is already in progress for this user.
 */
export function acquireSubmissionLock(userId: string): boolean {
  if (inFlightSubmissions.has(userId)) {
    return false;
  }
  inFlightSubmissions.add(userId);
  return true;
}

/**
 * Releases the in-flight submission lock for a user.
 * Must be called in a finally block after the submission completes.
 */
export function releaseSubmissionLock(userId: string): void {
  inFlightSubmissions.delete(userId);
}

// In-flight execution tracker: userId -> true while an execution request is processing
const inFlightExecutions = new Set<string>();

export function acquireExecutionLock(userId: string): boolean {
  if (inFlightExecutions.has(userId)) {
    return false;
  }
  inFlightExecutions.add(userId);
  return true;
}

export function releaseExecutionLock(userId: string): void {
  inFlightExecutions.delete(userId);
}

/**
 * Authoritative server-side execution rate limits:
 * - Max 10 executions per 10 minutes per authenticated user.
 * - Max 50 executions per 1 hour per authenticated user.
 */
export function checkExecutionRateLimit(userId: string): {
  success: boolean;
  error?: string;
  remaining?: number;
  reset?: number;
} {
  // 10 executions per 10 minutes (600,000 ms)
  const tenMinCheck = checkRateLimit(`exec_10m_${userId}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!tenMinCheck.success) {
    return {
      success: false,
      error: `Rate limit exceeded: Maximum 10 executions per 10 minutes. Please wait ${tenMinCheck.reset} seconds.`,
      remaining: 0,
      reset: tenMinCheck.reset,
    };
  }

  // 50 executions per 1 hour (3,600,000 ms)
  const oneHourCheck = checkRateLimit(`exec_1h_${userId}`, {
    limit: 50,
    windowMs: 60 * 60 * 1000,
  });

  if (!oneHourCheck.success) {
    return {
      success: false,
      error: `Rate limit exceeded: Maximum 50 executions per hour. Please wait ${oneHourCheck.reset} seconds.`,
      remaining: 0,
      reset: oneHourCheck.reset,
    };
  }

  return {
    success: true,
    remaining: Math.min(tenMinCheck.remaining, oneHourCheck.remaining),
    reset: Math.max(tenMinCheck.reset, oneHourCheck.reset),
  };
}

