# Turbo C Compatibility Mode

## Overview

Many university engineering curriculums, particularly in India, continue to teach C programming using **Borland Turbo C / C++ 3.0** (released in the early 1990s for MS-DOS). 

In undergraduate lab courses, students are routinely instructed to write:
- `void main()` instead of `int main(void)`
- `#include <conio.h>` or `#include < conio.h >`
- `clrscr()` to clear the DOS screen at the start of execution
- `getch()` or `getche()` at the end of the program to pause the console until a key is pressed
- `gets()` for string input
- Prompts before `scanf` without trailing newlines (e.g. `printf("Enter three integers:"); scanf(...); printf("Average = %.2f", avg);`), producing output like:
  ```text
  Enter three integers:Average = 5.00
  ```
- Glued labels without separating whitespace (e.g. `Simple Interest=100.00`, `a=5, b=3`, `Total: 15`).

On modern Linux-based automated judges (running GCC 14/15 in C17/C23 mode), these vintage lab programs immediately fail with **Compilation Error** (missing `<conio.h>`, `void main` signature), **Time Limit Exceeded** (`getch()` hanging on stdin), or **Wrong Answer** (prompts polluting expected stdout).

**Turbo C Mode** is an opt-in compatibility feature on InsidCode designed to bridge this 35-year gap. When enabled, it compiles legacy college lab code cleanly on modern GCC and judges the output with a relaxed tail comparator.

---

## Architectural Design

```
+-------------------------------------------------------------------------+
|                              Client (UI)                                |
|  - Switch button near language picker (role="switch", aria-checked)     |
|  - Off by default; persisted in localStorage ("insidcode:turboc-mode")  |
|  - Only visible when language === "c"                                   |
|  - Never available in 1v1 Duels                                         |
+-------------------------------------------------------------------------+
                                    |
                        { compat: "turboc" }
                                    v
+-------------------------------------------------------------------------+
|                       Server Evaluation Pipeline                        |
|                                                                         |
|  1. Unsupported Header Guard                                            |
|     - Detects <graphics.h>, <dos.h>, <bios.h>                           |
|     - Returns friendly Compile Error explaining Linux environment       |
|                                                                         |
|  2. Source Preprocessing & Wrapping (src/lib/turboc.ts)                 |
|     - Strips <conio.h> while preserving exact line count                |
|     - Injects prelude: clrscr(), getch(), safe gets(), #line 1          |
|     - Wraps void main() -> user_main() and injects standard main()      |
|                                                                         |
|  3. Compilation & Execution (GCC 15 on Linux)                           |
|     - Compiles standard C binary                                        |
|     - Executes code with problem test case inputs                       |
|                                                                         |
|  4. Relaxed Verdict Comparison (compareTurboCOutput)                    |
|     - Extracts numbers / tokens from output tail                        |
|     - Ignores leading prompts and glued labels                          |
|     - Detects missing spaces between digits with actionable hints       |
|                                                                         |
|  5. Result Presentation                                                 |
|     - Raw stdout preserved intact for student inspection                |
|     - "Judged in Turbo C mode" badge displayed                          |
+-------------------------------------------------------------------------+
```

---

## 1. Source Transformation & Prelude

When `compat: "turboc"` is requested:

### Line-Preserving Conio Stripping
Students need compiler line numbers in error messages to match their editor line numbers exactly. The conio stripper uses regex anchored on lines:
```regex
^\s*#\s*include\s*[<"]\s*conio\.h\s*[>"]\s*(?:\/\/.*)?$
```
Matches are replaced with an empty blank line rather than removed, keeping total line count unchanged.

### Compatibility Prelude & Shims
The source is wrapped with:
```c
#include <stdio.h>
#include <string.h>

/* Turbo C Compatibility Shims */
static void clrscr(void) {}
static int getch(void) { return 0; }
static int getche(void) { return 0; }

/* Safe gets shim using fgets without trailing newline */
static char* insidcode_gets(char *s) {
  if (!s) return NULL;
  if (!fgets(s, 1024, stdin)) return NULL;
  size_t len = strlen(s);
  if (len > 0 && s[len - 1] == '\n') s[len - 1] = '\0';
  return s;
}
#define gets insidcode_gets

#define main user_main
#line 1
/* --- Student's Original Code Begins Here --- */
```

And followed by a standard C postlude:
```c
#undef main
int main(void) {
  user_main();
  return 0;
}
```

### `#line 1` Directive
Because the prelude contains 17 lines of shims, any compilation error in student code would normally be offset by +17 lines. Inscribing `#line 1` directly before the student's code resets GCC's internal line counter. If an error is on line 5 of their code, GCC reports `line 5`.

### Safe Wrapping Guards
Code is **not** wrapped if:
1. `user_main` is already defined in the source (avoids recursive macro collision).
2. `main` takes parameters (e.g. `int main(int argc, char *argv[])` or `char **argv`).
3. No `main` definition exists.
4. Casing is wrong (e.g. `Void main()` or `VOID main()`), letting GCC issue standard compiler warnings/errors.

---

## 2. Unsupported Vintage Headers

Turbo C included proprietary MS-DOS 16-bit graphics and hardware libraries. These cannot run on 64-bit Linux server containers without emulating an x86 DOS machine.

When code includes these headers, the judge catches them before execution and returns an informative, educational Compile Error:

- **`<graphics.h>`**:
  > *"Turbo C had graphics.h. The internet does not. InsidCode runs on modern Linux servers without a virtual graphics card. Try a plain C solution with printf."*
- **`<dos.h>` or `<bios.h>`**:
  > *"This uses DOS-specific hardware APIs from the 1980s that only run inside 16-bit MS-DOS. Use standard C library functions instead."*

In the terminal output, these compilation failures are badged with:
`Environment limitation (not a logic error)`.

---

## 3. Relaxed Output Comparator

College lab programs output answers mixed with interactive prompts and labels. For example, problem #001 expects `5.00`, but a lab program produces:
```text
Enter three integers:Average = 5.00
```

### Why Not Simple "Contains Anywhere"?
Naive sub-string checking (`actual.includes(expected)`) creates serious false positives:
- A program printing `Loop 15: done` for an expected answer `15`.
- A program printing `Total: 215` when expected answer is `15`.
- A program echoing input values that happen to match the expected output.

### Tail Comparison Algorithm (`compareTurboCOutput`)
The comparator examines the **tail** (the final output tokens) of the student's program:

1. **Rule 1: All Expected Tokens Are Numbers**
   - Expected output is tokenized by whitespace. If every token is a number (`-?\d+(\.\d+)?`):
   - All numbers from the student output are extracted as maximal runs (e.g. `1100.00` is one number, `a=-3` yields `-3`).
   - The **last $N$ numbers** (where $N$ = expected token count) must match the expected tokens exactly.
   - Example: `Enter two numbers:After swapping: a=20, b=10` with expected `20 10` extracts numbers `[20, 10]`, which matches.

2. **Rule 2: Word / Text Answers**
   - Output is tokenized by whitespace and delimiter characters: `[\s=:,]+`.
   - The **last $N$ tokens** must match the expected tokens (case-sensitive, with case-insensitive fallback).
   - Example: `Day: Wednesday` with expected `Wednesday` splits to `["Day", "Wednesday"]`. The last token matches.

3. **Rule 3: Empty Expected Output**
   - Strictly requires actual output to be empty.

4. **Rule 4: Spacing Hint**
   - If the student's answer fails the comparator, but matches when all whitespace is removed from both outputs (e.g. actual `5.00100.00` vs expected `5.00 100.00`), a helpful hint is displayed:
     > *"Your digits are right but they're stuck together. Put a space or newline between numbers."*

---

## 4. UI & User Experience

- **Workspace Toggle**:
  Located adjacent to the language picker in `ProblemWorkspace.tsx`.
  - Accessible button with `role="switch"`, `aria-checked`, and keyboard focus styling.
  - Only visible when C is selected.
  - Persisted across page reloads in `localStorage` (`"insidcode:turboc-mode"`).
  - Toast confirmation on activation: *"Turbo C mode is on. We'll let void main() slide this time."*
- **Raw Stdout Preserved**:
  Clicking "Run Code" does not filter out prompts; the student sees their interactive prompts and stdout verbatim.
- **Result Badge**:
  When a submission is evaluated in Turbo C mode, the terminal displays a cyan badge:
  `Judged in Turbo C mode`.
- **Hints**:
  If a test case fails due to glued digits, the amber hint box is rendered prominently above the failed test case details.

---

## 5. Scope & Duels Policy

### Duels (1v1 Matchmaking)
Turbo C mode is **strictly disabled in 1v1 Duels**.
- Duel submissions evaluate solely against the standard competitive programming judge.
- The `compat` parameter is never sent from `src/app/duel/[roomCode]/page.tsx`.
- Even if a client manually injects `compat: "turboc"`, duel evaluation pipelines do not honor compatibility modes, protecting competitive integrity and Elo ratings.

### Problem Evaluation Integrity
- Hidden test cases and expected outputs remain completely concealed on the server.
- Turbo C mode changes only source compilation shims and output token parsing; it does not alter scoring rules, XP awards, streak calculations, or leaderboard rankings.
