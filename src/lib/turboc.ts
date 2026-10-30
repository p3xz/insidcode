/**
 * Turbo C Compatibility Mode for C language.
 *
 * Implements:
 * 1. Unsupported header detection (graphics.h, bios.h)
 * 2. Conio & dos.h stripping & full compatibility prelude (clrscr, gotoxy, wherex, getch, cprintf, delay, etc.)
 * 3. Line number preservation via #line 1
 * 4. Relaxed verdict comparison (tail numeric / token extraction, spacing hint)
 */

export interface TurboCHeaderCheckResult {
  unsupported: boolean;
  header?: string;
  message?: string;
}

const UNSUPPORTED_HEADERS = ["graphics.h", "bios.h"] as const;

/**
 * Checks if code attempts to include unsupported vintage Turbo C DOS/BIOS/graphics headers.
 * Case-insensitive match on the header name.
 */
export function checkUnsupportedHeaders(code: string): TurboCHeaderCheckResult {
  for (const header of UNSUPPORTED_HEADERS) {
    const escaped = header.replace(".", "\\.");
    const regex = new RegExp(`^\\s*#\\s*include\\s*[<"]\\s*${escaped}\\s*[>"]`, "im");
    if (regex.test(code)) {
      const message =
        header === "graphics.h"
          ? "Turbo C had graphics.h. The internet does not. InsidCode runs on modern Linux servers without a virtual graphics card. Try a plain C solution with printf."
          : "This uses BIOS hardware APIs from the 1980s that only run inside 16-bit MS-DOS. Use standard C library functions instead.";
      return {
        unsupported: true,
        header,
        message,
      };
    }
  }
  return { unsupported: false };
}

/**
 * Tolerantly replaces `#include <conio.h>` or `#include <dos.h>` with an empty line
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

    if (!inBlockComment && /^\s*#\s*include\s*[<"]\s*(?:conio|dos)\.h\s*[>"]\s*(?:\/\/.*)?$/i.test(line)) {
      lines[i] = ""; // Keep blank line
    }
  }

  return lines.join("\n");
}

/**
 * Detects if the return value of getch() or getche() is used in expressions,
 * assignments, conditionals, or function arguments.
 * If true, getch() reads from stdin via getchar(). If false, it acts as a non-blocking no-op.
 */
export function detectGetchReturnUsed(code: string): boolean {
  // 1. Strip comments and string/char literals
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*/g, " ")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");

  // 2. Remove standalone getch()/getche() statement calls iteratively
  let temp = stripped;
  let prev = "";
  while (temp !== prev) {
    prev = temp;
    temp = temp.replace(/(?:^|[;{}])\s*(?:\(void\)\s*)?getch(?:e)?\s*\(\)\s*;/gm, ";");
  }

  // 3. If getch or getche is still called as a function, its return value must be in use
  return /\bgetch(?:e)?\s*\(/.test(temp);
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
  // 1. Strip conio.h and dos.h includes
  const stripped = stripConioIncludes(code);

  // 2. If wrapper criteria not met, return stripped code directly
  if (!shouldWrapTurboC(stripped)) {
    return stripped;
  }

  // 3. Check getch return value heuristic
  const usesGetchReturn = detectGetchReturnUsed(stripped);

  const getchShims = usesGetchReturn
    ? [
        "static inline TURBOC_UNUSED int insidcode_getch(void) {",
        "  int ch = getchar();",
        "  return ch == EOF ? 0 : ch;",
        "}",
        "static inline TURBOC_UNUSED int getch(void) { return insidcode_getch(); }",
        "static inline TURBOC_UNUSED int getche(void) { return insidcode_getch(); }",
      ]
    : [
        "static inline TURBOC_UNUSED int getch(void) { return 0; }",
        "static inline TURBOC_UNUSED int getche(void) { return 0; }",
      ];

  const prelude = [
    "#include <stdio.h>",
    "#include <stdlib.h>",
    "#include <string.h>",
    "",
    "#ifdef __GNUC__",
    "#define TURBOC_UNUSED __attribute__((unused))",
    "#else",
    "#define TURBOC_UNUSED",
    "#endif",
    "",
    "/* Turbo C Color Constants */",
    "#ifndef BLACK",
    "#define BLACK 0",
    "#endif",
    "#ifndef BLUE",
    "#define BLUE 1",
    "#endif",
    "#ifndef GREEN",
    "#define GREEN 2",
    "#endif",
    "#ifndef CYAN",
    "#define CYAN 3",
    "#endif",
    "#ifndef RED",
    "#define RED 4",
    "#endif",
    "#ifndef MAGENTA",
    "#define MAGENTA 5",
    "#endif",
    "#ifndef BROWN",
    "#define BROWN 6",
    "#endif",
    "#ifndef LIGHTGRAY",
    "#define LIGHTGRAY 7",
    "#endif",
    "#ifndef DARKGRAY",
    "#define DARKGRAY 8",
    "#endif",
    "#ifndef LIGHTBLUE",
    "#define LIGHTBLUE 9",
    "#endif",
    "#ifndef LIGHTGREEN",
    "#define LIGHTGREEN 10",
    "#endif",
    "#ifndef LIGHTCYAN",
    "#define LIGHTCYAN 11",
    "#endif",
    "#ifndef LIGHTRED",
    "#define LIGHTRED 12",
    "#endif",
    "#ifndef LIGHTMAGENTA",
    "#define LIGHTMAGENTA 13",
    "#endif",
    "#ifndef YELLOW",
    "#define YELLOW 14",
    "#endif",
    "#ifndef WHITE",
    "#define WHITE 15",
    "#endif",
    "#ifndef BLINK",
    "#define BLINK 128",
    "#endif",
    "",
    "/* Turbo C Cursor Type Constants */",
    "#ifndef _NOCURSOR",
    "#define _NOCURSOR 0",
    "#endif",
    "#ifndef _SOLIDCURSOR",
    "#define _SOLIDCURSOR 1",
    "#endif",
    "#ifndef _NORMALCURSOR",
    "#define _NORMALCURSOR 2",
    "#endif",
    "",
    "/* Turbo C Conio No-op Stubs */",
    "static inline TURBOC_UNUSED void clrscr(void) {}",
    "static inline TURBOC_UNUSED void clreol(void) {}",
    "static inline TURBOC_UNUSED void gotoxy(int x, int y) { (void)x; (void)y; }",
    "static inline TURBOC_UNUSED void textcolor(int c) { (void)c; }",
    "static inline TURBOC_UNUSED void textbackground(int c) { (void)c; }",
    "static inline TURBOC_UNUSED void textattr(int a) { (void)a; }",
    "static inline TURBOC_UNUSED void highvideo(void) {}",
    "static inline TURBOC_UNUSED void lowvideo(void) {}",
    "static inline TURBOC_UNUSED void normvideo(void) {}",
    "static inline TURBOC_UNUSED void window(int l, int t, int r, int b) { (void)l; (void)t; (void)r; (void)b; }",
    "static inline TURBOC_UNUSED void _setcursortype(int t) { (void)t; }",
    "static inline TURBOC_UNUSED void delline(void) {}",
    "static inline TURBOC_UNUSED void insline(void) {}",
    "",
    "/* Turbo C Query Functions */",
    "static inline TURBOC_UNUSED int wherex(void) { return 1; }",
    "static inline TURBOC_UNUSED int wherey(void) { return 1; }",
    "static inline TURBOC_UNUSED int kbhit(void) { return 0; }",
    "",
    "/* Turbo C I/O Shims */",
    "#define cprintf printf",
    "#define cscanf scanf",
    "static inline TURBOC_UNUSED int cputs(const char *s) {",
    "  if (!s) return EOF;",
    "  return fputs(s, stdout);",
    "}",
    "static inline TURBOC_UNUSED int putch(int c) {",
    "  return putchar(c);",
    "}",
    "",
    "/* dos.h Shims */",
    "static inline TURBOC_UNUSED void delay(unsigned int ms) { (void)ms; }",
    "static inline TURBOC_UNUSED unsigned int insidcode_sleep(unsigned int s) { (void)s; return 0; }",
    "#define sleep insidcode_sleep",
    "",
    "/* Safe system() shim: no-ops cls/clear, blocks all other commands */",
    "static inline TURBOC_UNUSED int insidcode_system(const char *cmd) {",
    "  if (!cmd) return 0;",
    "  const char *p = cmd;",
    "  while (*p == ' ' || *p == '\\t') p++;",
    "  if ((p[0] == 'c' || p[0] == 'C') &&",
    "      (p[1] == 'l' || p[1] == 'L') &&",
    "      (p[2] == 's' || p[2] == 'S') &&",
    "      (p[3] == '\\0' || p[3] == ' ' || p[3] == '\\t' || p[3] == '\\r' || p[3] == '\\n')) {",
    "    return 0;",
    "  }",
    "  if ((p[0] == 'c' || p[0] == 'C') &&",
    "      (p[1] == 'l' || p[1] == 'L') &&",
    "      (p[2] == 'e' || p[2] == 'E') &&",
    "      (p[3] == 'a' || p[3] == 'A') &&",
    "      (p[4] == 'r' || p[4] == 'R') &&",
    "      (p[5] == '\\0' || p[5] == ' ' || p[5] == '\\t' || p[5] == '\\r' || p[5] == '\\n')) {",
    "    return 0;",
    "  }",
    "  return 0;",
    "}",
    "#define system insidcode_system",
    "",
    "/* Safe gets shim using fgets without trailing newline */",
    "static inline TURBOC_UNUSED char* insidcode_gets(char *s) {",
    "  if (!s) return NULL;",
    "  if (!fgets(s, 1024, stdin)) return NULL;",
    "  size_t len = strlen(s);",
    "  if (len > 0 && s[len - 1] == '\\n') s[len - 1] = '\\0';",
    "  return s;",
    "}",
    "#define gets insidcode_gets",
    "",
    ...getchShims,
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
