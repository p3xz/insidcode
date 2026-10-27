/**
 * Turbo C Compatibility Mode for C language.
 *
 * Implements:
 * 1. Unsupported header detection (graphics.h, dos.h, bios.h)
 * 2. Conio stripping & standard compatibility prelude (clrscr, getch, gets, main wrapper)
 * 3. Line number preservation via #line 1
 * 4. Relaxed verdict comparison (tail numeric / token extraction, spacing hint)
 */

export interface TurboCHeaderCheckResult {
  unsupported: boolean;
  header?: string;
  message?: string;
}

const UNSUPPORTED_HEADERS = ["graphics.h", "dos.h", "bios.h"] as const;

/**
 * Checks if code attempts to include unsupported vintage Turbo C DOS/BIOS/graphics headers.
 * Case-insensitive match on the header name.
 */
export function checkUnsupportedHeaders(code: string): TurboCHeaderCheckResult {
  for (const header of UNSUPPORTED_HEADERS) {
    const escaped = header.replace(".", "\\.");
    const regex = new RegExp(`^\\s*#\\s*include\\s*[<"]\\s*${escaped}\\s*[>"]`, "im");
    if (regex.test(code)) {
      return {
        unsupported: true,
        header,
        message: "Turbo C had graphics.h. The internet does not. Try a plain C solution.",
      };
    }
  }
  return { unsupported: false };
}

/**
 * Tolerantly replaces `#include <conio.h>` or `#include "conio.h"` with an empty line
 * to keep line numbers identical to the student's original source file.
 * Line-anchored so it does not replace text inside string literals or comments.
 */
export function stripConioIncludes(code: string): string {
  const lines = code.split("\n");
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!inBlockComment && trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/")) {
        inBlockComment = true;
        continue;
      }
    } else if (inBlockComment) {
      if (trimmed.includes("*/")) {
        inBlockComment = false;
      }
      continue;
    }

    if (!inBlockComment && /^\s*#\s*include\s*[<"]\s*conio\.h\s*[>"]\s*(?:\/\/.*)?$/i.test(line)) {
      lines[i] = ""; // Keep blank line
    }
  }

  return lines.join("\n");
}

/**
 * Checks whether user code should be wrapped with the Turbo C prelude and postlude.
 *
 * Requirements:
 * - Must NOT wrap if main takes arguments (argc/argv)
 * - Must NOT wrap if user_main is already defined in the code
 * - Must NOT wrap if there is no main definition
 * - Case-sensitive: `Void main()` or `VOID main()` is NOT wrapped so GCC issues a normal compile error.
 */
export function shouldWrapTurboC(code: string): boolean {
  // If user_main is already defined, do not wrap (prevents macro recursive collision)
  if (/\buser_main\b/.test(code)) {
    return false;
  }

  // If main takes parameters (e.g. int argc, char *argv[]), do not wrap
  if (/\bmain\s*\(\s*(?:int\s+argc|char\s*\*|void\s*\*)/.test(code)) {
    return false;
  }

  // Must have a main function definition/declaration (void main(), int main(), or main())
  // Case-sensitive: 'Void main' won't match here
  if (!/\b(?:void|int)?\s*main\s*\(/.test(code)) {
    return false;
  }

  return true;
}

/**
 * Wraps student Turbo C source with standard compatibility shims and `#line 1`.
 */
export function wrapTurboCCode(code: string): string {
  // 1. Strip conio.h includes
  const stripped = stripConioIncludes(code);

  // 2. If wrapper criteria not met, return stripped code directly
  if (!shouldWrapTurboC(stripped)) {
    return stripped;
  }

  const prelude = [
    "#include <stdio.h>",
    "#include <string.h>",
    "",
    "/* Turbo C Compatibility Shims */",
    "static void clrscr(void) {}",
    "static int getch(void) { return 0; }",
    "static int getche(void) { return 0; }",
    "",
    "/* Safe gets shim using fgets without trailing newline */",
    "static char* insidcode_gets(char *s) {",
    "  if (!s) return NULL;",
    "  if (!fgets(s, 1024, stdin)) return NULL;",
    "  size_t len = strlen(s);",
    "  if (len > 0 && s[len - 1] == '\\n') s[len - 1] = '\\0';",
    "  return s;",
    "}",
    "#define gets insidcode_gets",
    "",
    "#define main user_main",
    "#line 1",
    "",
  ].join("\n");

  const postlude = [
    "",
    "#undef main",
    "int main(void) {",
    "  user_main();",
    "  return 0;",
    "}",
  ].join("\n");

  return `${prelude}${stripped}${postlude}`;
}

export interface TurboCComparisonResult {
  passed: boolean;
  hint?: string;
}

/**
 * Relaxed verdict comparator for Turbo C mode.
 *
 * Rules:
 * 1. Normalize whitespace (spaces, tabs, newlines treated as token separators).
 *    Never use "contains anywhere"; always compare the tail.
 * 2. If every expected token is a number (-?\d+(\.\d+)?):
 *    Extract all numbers from student output as maximal runs (e.g. 1100.00 is one number, a=-3 yields -3).
 *    Require the LAST N numbers (N = expected count) to equal expected tokens as exact text.
 * 3. Otherwise (words in the answer):
 *    Split output on whitespace and on [=:,].
 *    Require the LAST N tokens to equal expected tokens (case-sensitive).
 * 4. If expected is empty, use strict comparison.
 * 5. If comparison fails but outputs are equal after removing ALL whitespace,
 *    return Wrong Answer with hint:
 *    "Your digits are right but they're stuck together. Put a space or newline between numbers."
 */
export function compareTurboCOutput(actualOutput: string, expectedOutput: string): TurboCComparisonResult {
  const normActual = actualOutput.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const normExpected = expectedOutput.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  // Rule 3: If expected is empty, use strict comparison
  if (normExpected === "") {
    return { passed: normActual === "" };
  }

  // Tokenize expected by whitespace
  const expectedTokens = normExpected.split(/\s+/).filter(Boolean);
  if (expectedTokens.length === 0) {
    return { passed: normActual === "" };
  }

  // Spacing hint check precomputation:
  // "If the comparison fails but the outputs are equal after removing ALL whitespace"
  const actualNoWs = actualOutput.replace(/\s+/g, "");
  const expectedNoWs = expectedOutput.replace(/\s+/g, "");
  const hasSpacingIssue = actualNoWs.length > 0 && actualNoWs === expectedNoWs;

  // Check if every expected token is a number
  const isNumberToken = (token: string) => /^-?\d+(?:\.\d+)?$/.test(token);
  const allExpectedAreNumbers = expectedTokens.every(isNumberToken);

  if (allExpectedAreNumbers) {
    // Rule 1: Extract all numbers from output as maximal runs
    // Matches maximal runs of digits with optional negative sign and optional decimal part
    const numberRegex = /-?\d+(?:\.\d+)?/g;
    const actualNumbers: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = numberRegex.exec(actualOutput)) !== null) {
      actualNumbers.push(match[0]);
    }

    const N = expectedTokens.length;
    if (actualNumbers.length >= N) {
      const tailNumbers = actualNumbers.slice(actualNumbers.length - N);
      let matches = true;
      for (let i = 0; i < N; i++) {
        if (tailNumbers[i] !== expectedTokens[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return { passed: true };
      }
    }

    return {
      passed: false,
      hint: hasSpacingIssue
        ? "Your digits are right but they're stuck together. Put a space or newline between numbers."
        : undefined,
    };
  }

  // Rule 2: Words in the answer
  // Split output on whitespace and on '=', ':', ','
  const outputTokens = actualOutput
    .split(/[\s=:,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const expectedWordTokens = normExpected
    .split(/[\s=:,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const N = expectedWordTokens.length;
  if (outputTokens.length >= N && N > 0) {
    const tailTokens = outputTokens.slice(outputTokens.length - N);
    let matches = true;
    for (let i = 0; i < N; i++) {
      if (tailTokens[i] !== expectedWordTokens[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return { passed: true };
    }
  }

  return {
    passed: false,
    hint: hasSpacingIssue
      ? "Your digits are right but they're stuck together. Put a space or newline between numbers."
      : undefined,
  };
}
