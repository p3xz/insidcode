import { LIMITS } from "./constants";

const ONLINECOMPILER_BASE_URL = "https://api.onlinecompiler.io";

export const ONLINECOMPILER_LANGUAGE_MAP: Record<string, string> = {
  python: "python-3.14",
  "python-3.14": "python-3.14",
  c: "gcc-15",
  "gcc-15": "gcc-15",
  cpp: "g++-15",
  "g++-15": "g++-15",
  java: "openjdk-25",
  "openjdk-25": "openjdk-25",
  javascript: "typescript-deno",
  typescript: "typescript-deno",
  "typescript-deno": "typescript-deno",
  csharp: "dotnet-csharp-9",
  "dotnet-csharp-9": "dotnet-csharp-9",
  fsharp: "dotnet-fsharp-9",
  "dotnet-fsharp-9": "dotnet-fsharp-9",
  php: "php-8.5",
  "php-8.5": "php-8.5",
  ruby: "ruby-4.0",
  "ruby-4.0": "ruby-4.0",
  haskell: "haskell-9.12",
  "haskell-9.12": "haskell-9.12",
  go: "go-1.26",
  "go-1.26": "go-1.26",
  rust: "rust-1.93",
  "rust-1.93": "rust-1.93",
};

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  output: string;
  code: number;
  signal: string | null;
  time?: string;
  memory?: string;
  compilationError?: string;
  runtimeError?: string;
  isTimeout?: boolean;
  systemError?: string;
}

export interface AsyncQueueResult {
  status: "queued" | "failed";
  queueId?: number | string;
  compilerId?: string;
  systemError?: string;
}

function getApiKey(): string {
  const key = process.env.ONLINECOMPILER_API_KEY;
  if (!key || key.trim() === "") {
    throw new Error("ONLINECOMPILER_API_KEY is not configured on the server.");
  }
  return key.trim();
}

export function resolveCompilerId(lang: string): string | null {
  const normalized = lang.toLowerCase().trim();
  return ONLINECOMPILER_LANGUAGE_MAP[normalized] || null;
}

const MAX_OUTPUT_BYTES = 256 * 1024; // 256 KB max output limit

function truncateOutput(str: string): string {
  if (Buffer.byteLength(str, "utf8") <= MAX_OUTPUT_BYTES) {
    return str;
  }
  return Buffer.from(str, "utf8").subarray(0, MAX_OUTPUT_BYTES).toString("utf8") + "\n... [Output truncated]";
}

export function classifyExecutionError(
  errorText: string
): { compilationError?: string; runtimeError?: string } {
  if (!errorText || errorText.trim() === "") {
    return { runtimeError: "Runtime execution terminated with non-zero exit code." };
  }

  const errLower = errorText.toLowerCase();

  // 1. Explicit Runtime Errors (Prioritized over generic compiler tokens)
  const isExplicitRuntimeError =
    errLower.includes("exception in thread") ||
    errLower.includes("java.lang.") ||
    errLower.includes("traceback (most recent call last)") ||
    errLower.includes("segmentation fault") ||
    errLower.includes("floating point exception") ||
    errLower.includes("aborted (core dumped)") ||
    errLower.includes("sigsegv") ||
    errLower.includes("sigfpe") ||
    errLower.includes("sigabrt") ||
    errLower.includes("terminate called") ||
    errLower.includes("zerodivisionerror") ||
    errLower.includes("indexerror") ||
    errLower.includes("keyerror") ||
    errLower.includes("valueerror") ||
    errLower.includes("nullpointerexception") ||
    errLower.includes("arithmeticexception") ||
    errLower.includes("arrayindexoutofboundsexception") ||
    errLower.includes("stringindexoutofboundsexception") ||
    errLower.includes("uncaught exception") ||
    errLower.includes("uncaught referenceerror") ||
    errLower.includes("uncaught typeerror") ||
    errLower.includes("uncaught rangeerror");

  if (isExplicitRuntimeError) {
    return { runtimeError: errorText };
  }

  // 2. Explicit Compilation Errors
  const isExplicitCompilationError =
    errLower.includes("syntaxerror") ||
    errLower.includes("indentationerror") ||
    errLower.includes("taberror") ||
    errLower.includes("parse error") ||
    errLower.includes("cannot find symbol") ||
    errLower.includes("undefined reference") ||
    errLower.includes("ld returned") ||
    errLower.includes("class, interface, enum, or record expected") ||
    errLower.includes("reached end of file while parsing") ||
    errLower.includes("illegal start of expression") ||
    errLower.includes("not a statement") ||
    errLower.includes("unclosed string literal") ||
    errLower.includes("expected ';'") ||
    errLower.includes("expected ')'") ||
    errLower.includes("expected '}'") ||
    errLower.includes("compilation error") ||
    errLower.includes("compilation failed") ||
    errLower.includes("fatal error:") ||
    (errLower.includes("error:") && !errLower.includes("runtime error"));

  if (isExplicitCompilationError) {
    return { compilationError: errorText };
  }

  // 3. Compiler source line diagnostic pattern check (e.g. "Solution.java:5:" or "main.cpp:4:1:")
  if (/\b\w+\.(?:java|cpp|c|cc|cxx):\d+/i.test(errorText)) {
    return { compilationError: errorText };
  }

  return { runtimeError: errorText };
}

/**
 * Dispatches asynchronous code execution to OnlineCompiler.
 * Uses POST /api/run-code/ endpoint.
 */
export async function executeCodeOnlineCompilerAsync(
  languageOrCompiler: string,
  code: string,
  stdin = "",
  extraParams?: Record<string, unknown>
): Promise<AsyncQueueResult> {
  const compilerId = resolveCompilerId(languageOrCompiler);
  if (!compilerId) {
    return {
      status: "failed",
      systemError: `Unsupported language or compiler: ${languageOrCompiler}`,
    };
  }

  // Enforce OnlineCompiler documented size limits
  if (Buffer.byteLength(code, "utf8") > LIMITS.CODE_MAX_BYTES) {
    return {
      status: "failed",
      systemError: "Code size exceeds maximum limit of 100 KB",
    };
  }

  if (Buffer.byteLength(stdin, "utf8") > 100 * 1024) {
    return {
      status: "failed",
      systemError: "Input size exceeds maximum limit of 100 KB",
    };
  }

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (err: unknown) {
    return {
      status: "failed",
      systemError: err instanceof Error ? err.message : "Server configuration error",
    };
  }

  const payload: Record<string, unknown> = {
    compiler: compilerId,
    code,
    input: stdin,
  };

  if (extraParams && Object.keys(extraParams).length > 0) {
    payload.extra_params = extraParams;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${ONLINECOMPILER_BASE_URL}/api/run-code/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return {
        status: "failed",
        systemError: "Code execution authorization failed. Check server credentials.",
      };
    }

    if (response.status === 429) {
      return {
        status: "failed",
        systemError: "Execution service is receiving high traffic. Please wait a moment.",
      };
    }

    if (response.status === 413) {
      return {
        status: "failed",
        systemError: "Payload exceeds execution service size limit (100 KB).",
      };
    }

    if (!response.ok && response.status !== 202) {
      return {
        status: "failed",
        systemError: `Execution service error (HTTP ${response.status}). Please try again later.`,
      };
    }

    const data = await response.json();
    return {
      status: "queued",
      queueId: data.id,
      compilerId,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return {
        status: "failed",
        systemError: "Execution request timed out connecting to compiler service.",
      };
    }
    return {
      status: "failed",
      systemError: "Failed to dispatch code to execution service. Please try again.",
    };
  }
}

/**
 * Dispatches synchronous code execution to OnlineCompiler.
 * Uses POST /api/run-code-sync/ endpoint.
 * Returns normalized execution result directly.
 */
export async function executeCodeOnlineCompilerSync(
  languageOrCompiler: string,
  code: string,
  stdin = ""
): Promise<ExecutionResult> {
  const compilerId = resolveCompilerId(languageOrCompiler);
  if (!compilerId) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      output: "",
      code: -1,
      signal: null,
      systemError: `Unsupported language or compiler: ${languageOrCompiler}`,
    };
  }

  // Size constraints
  if (Buffer.byteLength(code, "utf8") > LIMITS.CODE_MAX_BYTES) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      output: "",
      code: -1,
      signal: null,
      systemError: "Code size exceeds maximum limit of 100 KB",
    };
  }

  if (Buffer.byteLength(stdin, "utf8") > 100 * 1024) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      output: "",
      code: -1,
      signal: null,
      systemError: "Input size exceeds maximum limit of 100 KB",
    };
  }

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (err: unknown) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      output: "",
      code: -1,
      signal: null,
      systemError: err instanceof Error ? err.message : "Server configuration error",
    };
  }

  const payload = {
    compiler: compilerId,
    code,
    input: stdin,
  };

  const controller = new AbortController();
  // Allow up to 35 seconds (OnlineCompiler max timeout is 30s)
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  const startTime = Date.now();
  try {
    const response = await fetch(`${ONLINECOMPILER_BASE_URL}/api/run-code-sync/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsedMs = Date.now() - startTime;

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        output: "",
        code: response.status,
        signal: null,
        systemError: "Code execution authorization failed. Check server credentials.",
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        output: "",
        code: 429,
        signal: null,
        systemError: "Execution service is receiving high traffic. Please wait a moment.",
      };
    }

    if (response.status === 413) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        output: "",
        code: 413,
        signal: null,
        systemError: "Payload exceeds execution service size limit (100 KB).",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        output: "",
        code: response.status,
        signal: null,
        systemError: `Execution service returned HTTP ${response.status}. Please try again later.`,
      };
    }

    const data = await response.json();

    const output = truncateOutput(data.output || "");
    const error = truncateOutput(data.error || "");
    const isSuccess = data.status === "success" && (data.exit_code === 0 || data.exit_code === null);
    const executionTime = parseFloat(data.time || "0");
    const isTimeout =
      data.status === "timeout" ||
      data.error?.toLowerCase().includes("timeout") ||
      data.error?.toLowerCase().includes("timed out") ||
      executionTime >= 30 ||
      elapsedMs >= 29000;

    let compilationError: string | undefined = undefined;
    let runtimeError: string | undefined = undefined;

    if (!isSuccess && !isTimeout) {
      const classified = classifyExecutionError(error || "Execution error");
      compilationError = classified.compilationError;
      runtimeError = classified.runtimeError;
    }

    return {
      success: isSuccess,
      stdout: output,
      stderr: error,
      output: output || error,
      code: typeof data.exit_code === "number" ? data.exit_code : isSuccess ? 0 : -1,
      signal: data.signal ?? null,
      time: data.time || undefined,
      memory: data.memory || undefined,
      isTimeout,
      compilationError,
      runtimeError,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        stdout: "",
        stderr: "",
        output: "",
        code: -1,
        signal: "SIGKILL",
        isTimeout: true,
        systemError: "Execution timed out (30s limit exceeded)",
      };
    }

    return {
      success: false,
      stdout: "",
      stderr: "",
      output: "",
      code: -1,
      signal: null,
      systemError: "Code execution service is temporarily unavailable. Please try again later.",
    };
  }
}
