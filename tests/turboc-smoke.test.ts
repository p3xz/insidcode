import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  checkUnsupportedHeaders,
  stripConioIncludes,
  shouldWrapTurboC,
  wrapTurboCCode,
  compareTurboCOutput,
} from "../src/lib/turboc";

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name} ${detail ? `- ${detail}` : ""}`);
  }
}

console.log("\n=======================================================");
console.log("Suite 1: Relaxed Output Comparator Tests (10 Cases)");
console.log("=======================================================");

// Case 1: Average prompt without trailing newline
{
  const actual = "Enter three integers:Average = 5.00";
  const expected = "5.00";
  const res = compareTurboCOutput(actual, expected);
  assert(res.passed === true, "Case 1: Average prompt matches expected 5.00");
}

// Case 2: Simple interest glued label
{
  const actual = "Enter P, R, T:Simple Interest=100.00";
  const expected = "100.00";
  const res = compareTurboCOutput(actual, expected);
  assert(res.passed === true, "Case 2: Simple Interest=100.00 matches 100.00");
}

// Case 3: Glued label - correct number vs wrong number
{
  const actualPass = "Total: 15";
  const actualFail = "Total: 215";
  const expected = "15";
  const resPass = compareTurboCOutput(actualPass, expected);
  const resFail = compareTurboCOutput(actualFail, expected);
  assert(
    resPass.passed === true && resFail.passed === false,
    "Case 3: 'Total: 15' matches 15, but 'Total: 215' fails"
  );
}

// Case 4: Swap output with multiple numbers (positive & negative)
{
  const actualPos = "After swapping: a=5, b=3";
  const expectedPos = "5 3";
  const resPos = compareTurboCOutput(actualPos, expectedPos);

  const actualNeg = "After swapping: a=-5, b=-3";
  const expectedNeg = "-5 -3";
  const resNeg = compareTurboCOutput(actualNeg, expectedNeg);

  assert(
    resPos.passed === true && resNeg.passed === true,
    "Case 4: Multi-number swap matches for positive (5 3) and negative (-5 -3)"
  );
}

// Case 5: Text answer case sensitivity & case-insensitivity fallback
{
  const actualExact = "Today is Wednesday";
  const expected = "Wednesday";
  const resExact = compareTurboCOutput(actualExact, expected);

  assert(
    resExact.passed === true,
    "Case 5: Text answer matches exact token ('Wednesday')"
  );
}

// Case 6: Spacing hint when numbers run together
{
  const actual = "5.00100.00";
  const expected = "5.00 100.00";
  const res = compareTurboCOutput(actual, expected);
  assert(
    res.passed === false &&
      res.hint ===
        "Your digits are right but they're stuck together. Put a space or newline between numbers.",
    "Case 6: Stuck-together numbers produce friendly spacing hint"
  );
}

// Case 7: 2D Matrix output with prompt
{
  const actual = "Enter matrix elements:\n1 2\n3 4\n";
  const expected = "1 2\n3 4";
  const res = compareTurboCOutput(actual, expected);
  assert(res.passed === true, "Case 7: 2D Matrix with prompt matches expected rows");
}

// Case 8: Product output
{
  const actual = "Product = 20";
  const expected = "20";
  const res = compareTurboCOutput(actual, expected);
  assert(res.passed === true, "Case 8: Product = 20 matches 20");
}

// Case 9: Palindrome wording difference fails as expected
{
  const actualMismatch = "Result: YES";
  const expectedText = "Palindrome";
  const resMismatch = compareTurboCOutput(actualMismatch, expectedText);
  assert(
    resMismatch.passed === false,
    "Case 9: Unrelated text wording (YES vs Palindrome) correctly fails"
  );
}

// Case 10: Strict parity comparison
{
  const actual = "Average = 5.00\n";
  const expected = "5.00";
  const standardMatch = actual.trim() === expected.trim();
  const turboMatch = compareTurboCOutput(actual, expected).passed;
  assert(
    standardMatch === false && turboMatch === true,
    "Case 10: Standard judge rejects 'Average = 5.00', Turbo C mode accepts it"
  );
}

console.log("\n=======================================================");
console.log("Suite 2: Wrapper Boundary, Line Reporting & Safety Tests");
console.log("=======================================================");

// Wrapper boundary 1: void main() with clrscr() and getch()
{
  const code = `#include <stdio.h>\n#include <conio.h>\nvoid main() {\n  clrscr();\n  printf("Hello");\n  getch();\n}`;
  const wrapped = wrapTurboCCode(code);
  assert(
    shouldWrapTurboC(code) &&
      wrapped.includes("#line 1") &&
      wrapped.includes("void clrscr(void)") &&
      wrapped.includes("user_main()") &&
      !wrapped.includes("<conio.h>"),
    "Wrapper 1: void main() with clrscr() and getch() is wrapped with shims"
  );
}

// Wrapper boundary 2: #include < conio.h > with spaces
{
  const code = `#include < conio.h >\nvoid main() {}`;
  const stripped = stripConioIncludes(code);
  const lines = stripped.split("\n");
  assert(
    lines[0] === "" && lines[1] === "void main() {}",
    "Wrapper 2: '#include < conio.h >' stripped preserving line count"
  );
}

// Wrapper boundary 3: No conio include calling getch()
{
  const code = `#include <stdio.h>\nvoid main() { printf("Hi"); getch(); }`;
  const wrapped = wrapTurboCCode(code);
  assert(
    shouldWrapTurboC(code) && wrapped.includes("int getch(void)"),
    "Wrapper 3: getch() shim present even when conio.h was never included"
  );
}

// Wrapper boundary 4: Function prototype before void main()
{
  const code = `int add(int a, int b);\nvoid main() { add(1, 2); }\nint add(int a, int b) { return a + b; }`;
  assert(
    shouldWrapTurboC(code) === true,
    "Wrapper 4: Prototype before void main() correctly triggers wrapping"
  );
}

// Wrapper boundary 5: 'main' inside printf string literal is not mangled
{
  const code = `#include <stdio.h>\nvoid main() {\n  printf("Domain: example.com, main server\\n");\n}`;
  const wrapped = wrapTurboCCode(code);
  assert(
    wrapped.includes('"Domain: example.com, main server\\n"'),
    "Wrapper 5: 'main' inside string literal is preserved unchanged"
  );
}

// Wrapper boundary 6: Standard int main(int argc, char *argv[])
{
  const code = `#include <stdio.h>\nint main(int argc, char *argv[]) {\n  return 0;\n}`;
  assert(
    shouldWrapTurboC(code) === false,
    "Wrapper 6: int main(int argc, char *argv[]) is NOT wrapped"
  );
}

// Wrapper boundary 7: gets shim redirects safely to fgets
{
  const code = `#include <stdio.h>\nvoid main() { char s[100]; gets(s); }`;
  const wrapped = wrapTurboCCode(code);
  assert(
    wrapped.includes("insidcode_gets") &&
      wrapped.includes("#define gets insidcode_gets") &&
      wrapped.includes("fgets(s, 1024, stdin)"),
    "Wrapper 7: gets() shim wraps to fgets safely"
  );
}

// Wrapper boundary 8: Unsupported headers
{
  const graphicsCode = `#include <stdio.h>\n#include <graphics.h>\nvoid main() {}`;
  const dosCode = `#include <dos.h>\nvoid main() {}`;
  const biosCode = `#include <bios.h>\nvoid main() {}`;

  const gCheck = checkUnsupportedHeaders(graphicsCode);
  const dCheck = checkUnsupportedHeaders(dosCode);
  const bCheck = checkUnsupportedHeaders(biosCode);

  assert(
    gCheck !== null &&
      gCheck.header === "graphics.h" &&
      Boolean(gCheck.message?.includes("Turbo C had graphics.h")) &&
      dCheck !== null &&
      dCheck.header === "dos.h" &&
      Boolean(dCheck.message?.includes("DOS-specific hardware APIs")) &&
      bCheck !== null &&
      bCheck.header === "bios.h" &&
      Boolean(bCheck.message?.includes("DOS-specific hardware APIs")),
    "Wrapper 8: Unsupported DOS/Turbo C headers accurately detected with helpful error messages"
  );
}

// Wrapper boundary 9: Compile error line reporting matches original user line via #line 1
{
  const tempErrDir = fs.mkdtempSync(path.join(os.tmpdir(), "turboc-line-"));
  const badCode = `#include <stdio.h>
#include <conio.h>
void main() {
    clrscr();
    syntax_error_here;
    getch();
}`;
  const wrapped = wrapTurboCCode(badCode);
  const badFile = path.join(tempErrDir, "bad.c");
  fs.writeFileSync(badFile, wrapped, "utf8");

  try {
    execSync(`gcc "${badFile}" -o "${path.join(tempErrDir, "bad.exe")}"`, {
      stdio: "pipe",
    });
    assert(false, "Wrapper 9: Expected compile error, but compilation succeeded");
  } catch (err: unknown) {
    const errorObj = err as { stderr?: Buffer; message?: string };
    const errOutput = errorObj.stderr?.toString() || "";
    // Line 5 in user code is syntax_error_here;
    // With #line 1, GCC reports error on line 5 (e.g. "bad.c:5:5: error: 'syntax_error_here' undeclared")
    assert(
      /:5:\d+: error:/.test(errOutput),
      "Wrapper 9: Compile error reports user line 5, not prelude line number",
      errOutput
    );
  } finally {
    try {
      fs.rmSync(tempErrDir, { recursive: true, force: true });
    } catch {}
  }
}

// Wrapper boundary 10: Runtime crash (divide-by-zero or abort) is not masked
{
  const tempCrashDir = fs.mkdtempSync(path.join(os.tmpdir(), "turboc-crash-"));
  const crashCode = `#include <stdio.h>
#include <conio.h>
void main() {
    int a = 10;
    int b = 0;
    int c = a / b;
    printf("%d", c);
}`;
  const wrapped = wrapTurboCCode(crashCode);
  const crashFile = path.join(tempCrashDir, "crash.c");
  const crashExe = path.join(tempCrashDir, "crash.exe");
  fs.writeFileSync(crashFile, wrapped, "utf8");

  try {
    execSync(`gcc -O0 "${crashFile}" -o "${crashExe}"`, { stdio: "pipe" });
    try {
      execSync(`"${crashExe}"`, { stdio: "pipe" });
      assert(false, "Wrapper 10: Expected runtime crash, but execution succeeded");
    } catch {
      assert(true, "Wrapper 10: Runtime crash is preserved (non-zero / signal exit)");
    }
  } finally {
    try {
      fs.rmSync(tempCrashDir, { recursive: true, force: true });
    } catch {}
  }
}

console.log("\n=======================================================");
console.log("Suite 3: Local GCC Compilation & Execution Smoke Tests (10 Lab Fixtures)");
console.log("=======================================================");

const labFixtures = [
  {
    name: "Lab 1: Average of 3 integers",
    code: `#include <stdio.h>
#include <conio.h>
void main() {
    int a, b, c;
    float avg;
    clrscr();
    printf("Enter three integers:");
    scanf("%d %d %d", &a, &b, &c);
    avg = (a + b + c) / 3.0;
    printf("Average = %.2f", avg);
    getch();
}`,
    stdin: "4 5 6\n",
    expectedOutput: "5.00",
  },
  {
    name: "Lab 2: Leap year check",
    code: `#include <stdio.h>
#include <conio.h>
void main() {
    int y;
    clrscr();
    printf("Enter year: ");
    scanf("%d", &y);
    if ((y % 4 == 0 && y % 100 != 0) || (y % 400 == 0))
        printf("Leap Year");
    else
        printf("Not Leap Year");
    getch();
}`,
    stdin: "2024\n",
    expectedOutput: "Leap Year",
  },
  {
    name: "Lab 3: Swap two numbers",
    code: `#include <stdio.h>
#include<conio.h>
void main() {
    int a, b, temp;
    clrscr();
    printf("Enter two numbers:");
    scanf("%d %d", &a, &b);
    temp = a;
    a = b;
    b = temp;
    printf("After swapping: a=%d, b=%d", a, b);
    getch();
}`,
    stdin: "10 20\n",
    expectedOutput: "20 10",
  },
  {
    name: "Lab 4: Simple interest calculation",
    code: `#include <stdio.h>
#include <conio.h>
void main() {
    float p, r, t, si;
    clrscr();
    printf("Enter P, R, T: ");
    scanf("%f %f %f", &p, &r, &t);
    si = (p * r * t) / 100.0;
    printf("Simple Interest=%.2f", si);
    getch();
}`,
    stdin: "1000 5 2\n",
    expectedOutput: "100.00",
  },
  {
    name: "Lab 5: Day of week using switch",
    code: `#include <stdio.h>
#include <conio.h>
void main() {
    int day;
    clrscr();
    printf("Enter day number (1-7):");
    scanf("%d", &day);
    switch(day) {
        case 1: printf("Monday"); break;
        case 2: printf("Tuesday"); break;
        case 3: printf("Wednesday"); break;
        case 4: printf("Thursday"); break;
        case 5: printf("Friday"); break;
        case 6: printf("Saturday"); break;
        case 7: printf("Sunday"); break;
        default: printf("Invalid");
    }
    getch();
}`,
    stdin: "3\n",
    expectedOutput: "Wednesday",
  },
  {
    name: "Lab 6: Sum of digits with break",
    code: `#include <stdio.h>
#include <conio.h>
void main() {
    int n, sum = 0, rem;
    clrscr();
    printf("Enter a number:");
    scanf("%d", &n);
    while (1) {
        if (n <= 0) break;
        rem = n % 10;
        sum += rem;
        n /= 10;
    }
    printf("Sum of digits = %d", sum);
    getch();
}`,
    stdin: "1234\n",
    expectedOutput: "10",
  },
  {
    name: "Lab 7: Array sum and average",
    code: `#include <stdio.h>
#include <conio.h>
void main() {
    int n, i, arr[10], sum = 0;
    clrscr();
    printf("Enter count: ");
    scanf("%d", &n);
    for (i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
        sum += arr[i];
    }
    printf("Total: %d", sum);
    getch();
}`,
    stdin: "4\n1 2 3 4\n",
    expectedOutput: "10",
  },
  {
    name: "Lab 8: Palindrome check with string.h",
    code: `#include <stdio.h>
#include <conio.h>
#include <string.h>
void main() {
    char s[50], rev[50];
    int len, i;
    clrscr();
    printf("Enter string: ");
    scanf("%s", s);
    len = strlen(s);
    for (i = 0; i < len; i++) {
        rev[i] = s[len - 1 - i];
    }
    rev[len] = '\\0';
    if (strcmp(s, rev) == 0)
        printf("Palindrome");
    else
        printf("Not Palindrome");
    getch();
}`,
    stdin: "racecar\n",
    expectedOutput: "Palindrome",
  },
  {
    name: "Lab 9: 2D Matrix Sum",
    code: `#include <stdio.h>
#include <conio.h>
void main() {
    int mat[2][2], i, j, sum = 0;
    clrscr();
    printf("Enter 4 elements:\\n");
    for (i = 0; i < 2; i++) {
        for (j = 0; j < 2; j++) {
            scanf("%d", &mat[i][j]);
            sum += mat[i][j];
        }
    }
    printf("Matrix Sum = %d", sum);
    getch();
}`,
    stdin: "1 2 3 4\n",
    expectedOutput: "10",
  },
  {
    name: "Lab 10: Prototype before main calling product",
    code: `#include <stdio.h>
#include <conio.h>
int multiply(int x, int y);
void main() {
    int a = 4, b = 5, res;
    clrscr();
    res = multiply(a, b);
    printf("Product = %d", res);
    getch();
}
int multiply(int x, int y) {
    return x * y;
}`,
    stdin: "\n",
    expectedOutput: "20",
  },
];

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "turboc-smoke-"));

try {
  labFixtures.forEach((fixture, idx) => {
    const wrappedCode = wrapTurboCCode(fixture.code);
    const srcFile = path.join(tmpDir, `fixture_${idx + 1}.c`);
    const exeFile = path.join(tmpDir, `fixture_${idx + 1}.exe`);
    fs.writeFileSync(srcFile, wrappedCode, "utf8");

    try {
      // Compile with local gcc
      execSync(`gcc -O2 -Wall -Wno-unused-result "${srcFile}" -o "${exeFile}"`, {
        stdio: "pipe",
      });

      // Execute with stdin
      const actualStdout = execSync(`"${exeFile}"`, {
        input: fixture.stdin,
        stdio: "pipe",
        timeout: 5000,
      }).toString();

      // Compare using compareTurboCOutput
      const comparison = compareTurboCOutput(actualStdout, fixture.expectedOutput);
      assert(
        comparison.passed,
        fixture.name,
        `Expected: "${fixture.expectedOutput}", Actual stdout: "${actualStdout.trim()}"`
      );
    } catch (err: unknown) {
      const errorObj = err as { stderr?: Buffer; message?: string };
      assert(false, fixture.name, errorObj.stderr?.toString() || errorObj.message);
    }
  });
} finally {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
}

console.log("\n=======================================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
}
