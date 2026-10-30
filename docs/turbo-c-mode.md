# Turbo C Compatibility Mode

## Overview

Many university engineering curriculums continue to teach C programming using vintage **Borland Turbo C / C++ 3.0** (released in the early 1990s for MS-DOS). 

In undergraduate lab courses, students are routinely instructed to write:
- `void main()` instead of `int main(void)`
- `#include <conio.h>` or `#include <dos.h>`
- `clrscr()` or `system("cls")` to clear the DOS screen
- `getch()` or `getche()` at the end of the program to pause the console until a key is pressed, or `ch = getch()` to read single characters
- `gotoxy(x, y)`, `textcolor()`, `textbackground()`, and `highvideo()` for DOS console styling
- `delay(ms)` or `sleep(s)` for animation pauses
- `cprintf()`, `cputs()`, `putch()`, and `cscanf()`
- `gets()` for string input
- Prompts before `scanf` without trailing newlines (e.g. `printf("Enter three integers:"); scanf(...); printf("Average = %.2f", avg);`), producing output like:
  ```text
  Enter three integers:Average = 5.00
  ```
- Glued labels without separating whitespace (e.g. `Simple Interest=100.00`, `a=5, b=3`, `Total: 15`).

On modern Linux-based automated judges (running GCC 14/15 in C17/C23 mode), these vintage lab programs immediately fail with **Compilation Error** (missing `<conio.h>`, `void main` signature), **Time Limit Exceeded** (`getch()` hanging on stdin or `delay()` sleeping), or **Wrong Answer** (prompts polluting expected stdout).

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
|     - Detects <graphics.h>, <bios.h>                                    |
|     - Returns friendly Compile Error explaining Linux environment       |
|                                                                         |
|  2. Source Preprocessing & Wrapping (src/lib/turboc.ts)                 |
|     - Strips <conio.h> & <dos.h> while preserving exact line count      |
|     - Injects prelude: conio stubs, dos.h shims, colors, safe gets      |
|     - Contextual getch() heuristic (no-op pause vs stdin reader)        |
|     - Safe system("cls") shim blocking dangerous commands               |
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

### Line-Preserving Conio & DOS Header Stripping
Students need compiler line numbers in error messages to match their editor line numbers exactly. The stripper uses regex anchored on lines:
```regex
^\s*#\s*include\s*[<"]\s*(?:conio|dos)\.h\s*[>"]\s*(?:\/\/.*)?$
```
Matches are replaced with an empty blank line rather than removed, keeping total line count unchanged.

### Compatibility Prelude & Shims
The source is wrapped with:
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Turbo C Color Constants */
#ifndef BLACK
#define BLACK 0
#define BLUE 1
#define GREEN 2
#define CYAN 3
#define RED 4
#define MAGENTA 5
#define BROWN 6
#define LIGHTGRAY 7
#define DARKGRAY 8
#define LIGHTBLUE 9
#define LIGHTGREEN 10
#define LIGHTCYAN 11
#define LIGHTRED 12
#define LIGHTMAGENTA 13
#define YELLOW 14
#define WHITE 15
#define BLINK 128
#endif

/* Turbo C Cursor Type Constants */
#ifndef _NOCURSOR
#define _NOCURSOR 0
#define _SOLIDCURSOR 1
#define _NORMALCURSOR 2
#endif

/* Conio No-op Stubs */
static inline void clrscr(void) {}
static inline void clreol(void) {}
static inline void gotoxy(int x, int y) { (void)x; (void)y; }
static inline void textcolor(int c) { (void)c; }
static inline void textbackground(int c) { (void)c; }
static inline void textattr(int a) { (void)a; }
static inline void highvideo(void) {}
static inline void lowvideo(void) {}
static inline void normvideo(void) {}
static inline void window(int l, int t, int r, int b) { (void)l; (void)t; (void)r; (void)b; }
static inline void _setcursortype(int t) { (void)t; }
static inline void delline(void) {}
static inline void insline(void) {}

/* Conio Query Functions */
static inline int wherex(void) { return 1; }
static inline int wherey(void) { return 1; }
static inline int kbhit(void) { return 0; }

/* Conio I/O Shims */
#define cprintf printf
#define cscanf scanf
static inline int cputs(const char *s) {
  if (!s) return EOF;
  return fputs(s, stdout);
}
static inline int putch(int c) {
  return putchar(c);
}

/* dos.h Timing Controls */
static inline void delay(unsigned int ms) { (void)ms; }
static inline unsigned int insidcode_sleep(unsigned int s) { (void)s; return 0; }
#define sleep insidcode_sleep

/* Safe system() shim: no-ops cls/clear, blocks all other commands */
static inline int insidcode_system(const char *cmd) {
  if (!cmd) return 0;
  // If cls or clear, safely return 0; block any dangerous commands
  ...
}
#define system insidcode_system

/* Contextual getch() / getche() */
// If return value is used (e.g. c = getch()): reads via getchar()
// If called as a standalone pause statement: no-op returning 0

/* Safe gets() shim using fgets without trailing newline */
static inline char* insidcode_gets(char *s) { ... }
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

### Contextual `getch()` / `getche()` Heuristic
In traditional DOS lab programs, `getch()` is used for two completely distinct purposes:
1. **Console pause at end of program**: `getch();` at the end of `main()`. If this read from stdin on a headless Linux judge, the program would hang until TLE (Time Limit Exceeded). Here, it safely no-ops returning 0.
2. **Interactive character input**: `char ch = getch();` or `switch(getch())`. Here, the AST/heuristic recognizes the return value is consumed and automatically routes it to `getchar()`, allowing interactive character-based lab solutions to work seamlessly.

### Safe `system("cls")` & Command Blocking
Many students write `system("cls");` or `system("clear");`. Rather than spawning a real shell sub-process (which is costly and dangerous in multi-tenant judge workers), the injected `system` shim intercepts `cls` and `clear` as safe no-ops and blocks all other commands.

### `#line 1` Directive
Because the prelude contains shim definitions, any compilation error in student code would normally be offset by the prelude line count. Inscribing `#line 1` directly before the student's code resets GCC's internal line counter. If an error is on line 5 of their code, GCC reports `line 5`.

### Safe Wrapping Guards
Code is **not** wrapped if:
1. `user_main` is already defined in the source (avoids recursive macro collision).
2. `main` takes parameters (e.g. `int main(int argc, char *argv[])` or `char **argv`).
3. No `main` definition exists.
4. Casing is wrong (e.g. `Void main()` or `VOID main()`), letting GCC issue standard compiler warnings/errors.

---

## 2. Unsupported Vintage Headers

Turbo C included proprietary MS-DOS 16-bit graphics and BIOS libraries. These cannot run on 64-bit Linux server containers without emulating an x86 DOS machine.

When code includes these headers, the judge catches them before execution and returns an informative, educational Compile Error:

- **`<graphics.h>`**:
  > *"Turbo C had graphics.h. The internet does not. InsidCode runs on modern Linux servers without a virtual graphics card. Try a plain C solution with printf."*
- **`<bios.h>`**:
  > *"This uses BIOS hardware APIs from the 1980s that only run inside 16-bit MS-DOS. Use standard C library functions instead."*

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
  - Accessible switch (`role="switch"`, `aria-checked`).
  - Off by default; selection remembered in browser `localStorage`.
  - Only visible when the selected language is C.
  - Excluded entirely from Duels.
- **Microcopy**:
  - Tooltip: *"Your college still uses Turbo C. We get it. Turn this on and we'll quietly fix the old-style stuff."*
  - Toast on enable: *"Turbo C mode is on. We'll let void main() slide this time."*
  - Result badge: *"Judged in Turbo C mode"*.
- **Full Output Transparency**:
  The student always sees their raw output exactly as generated (including all prompts and labels) in the terminal output tab. Relaxed matching is applied solely to calculate the verdict.
