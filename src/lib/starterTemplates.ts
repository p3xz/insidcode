import { StarterTemplates } from "@/types";

export function generateDefaultStarterTemplates(problemTitle: string): StarterTemplates {
  return {
    python: `# Language: Python 3\n# Problem: ${problemTitle}\n\nimport sys\n\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if not lines:\n        return\n    \n    # Write your solution here\n    # Example: read line -> parse -> print answer\n    \n\nif __name__ == "__main__":\n    solve()\n`,

    javascript: `// Language: JavaScript (Node.js)\n// Problem: ${problemTitle}\n\nconst fs = require('fs');\n\nfunction solve() {\n    const input = fs.readFileSync('/dev/stdin', 'utf-8');\n    const lines = input.trim().split('\\n');\n    \n    // Write your solution here\n    \n}\n\nsolve();\n`,

    cpp: `// Language: C++ (g++)\n// Problem: ${problemTitle}\n\n#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Write your solution here\n    \n    return 0;\n}\n`,

    c: `/* Language: C (gcc)\n * Problem: ${problemTitle}\n */\n\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}\n`,

    java: `// Language: Java (OpenJDK)\n// Problem: ${problemTitle}\n\nimport java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        \n        // Write your solution here\n        \n        scanner.close();\n    }\n}\n`,
  };
}
