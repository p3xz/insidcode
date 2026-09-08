import { LIMITS, SUPPORTED_LANGUAGES, SupportedLanguageId } from "./constants";

export interface PistonExecuteResult {
  success: boolean;
  stdout: string;
  stderr: string;
  output: string;
  code: number;
  signal: string | null;
  compilationError?: string;
  runtimeError?: string;
  isTimeout?: boolean;
  systemError?: string;
}

const PISTON_URL = process.env.PISTON_URL || "https://emkc.org/api/v2/piston";

export async function executeCodeWithPiston(
  language: SupportedLanguageId,
  code: string,
  stdin = ""
): Promise<PistonExecuteResult> {
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.id === language);
  if (!langConfig) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      output: "",
      code: -1,
      signal: null,
      systemError: `Unsupported language: ${language}`,
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

  if (Buffer.byteLength(stdin, "utf8") > LIMITS.CUSTOM_INPUT_MAX_BYTES) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      output: "",
      code: -1,
      signal: null,
      systemError: "Input size exceeds maximum limit of 32 KB",
    };
  }

  const payload = {
    language: langConfig.pistonLanguage,
    version: langConfig.version,
    files: [
      {
        content: code,
      },
    ],
    stdin: stdin,
    run_timeout: 5000,
    compile_timeout: 10000,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LIMITS.EXECUTION_TIMEOUT_MS);

  try {
    const response = await fetch(`${PISTON_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        output: "",
        code: response.status,
        signal: null,
        systemError: "Code execution service returned an error. Please try again later.",
      };
    }

    const data = await response.json();

    // Check compilation errors
    if (data.compile && data.compile.code !== 0) {
      return {
        success: false,
        stdout: data.compile.stdout || "",
        stderr: data.compile.stderr || "",
        output: data.compile.output || data.compile.stderr || "Compilation Error",
        code: data.compile.code,
        signal: data.compile.signal,
        compilationError: data.compile.stderr || data.compile.output || "Compilation Error",
      };
    }

    const run = data.run;
    if (!run) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        output: "",
        code: -1,
        signal: null,
        systemError: "Invalid execution response format",
      };
    }

    const isTimeout = run.signal === "SIGKILL" || run.code === 137;
    const hasRuntimeError = run.code !== 0 && !isTimeout;

    return {
      success: run.code === 0,
      stdout: run.stdout || "",
      stderr: run.stderr || "",
      output: run.output || run.stdout || run.stderr || "",
      code: run.code,
      signal: run.signal,
      isTimeout,
      runtimeError: hasRuntimeError ? run.stderr || run.output || "Runtime Error" : undefined,
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
        systemError: "Execution timed out (10s limit exceeded)",
      };
    }

    console.error("Piston request failed:", error);
    return {
      success: false,
      stdout: "",
      stderr: "",
      output: "",
      code: -1,
      signal: null,
      systemError: "Code execution is temporarily unavailable. Please try again later.",
    };
  }
}
