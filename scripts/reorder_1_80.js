const fs = require('fs');
const path = require('path');

const curriculumPath = path.join(__dirname, '..', 'src', 'lib', 'curriculumData.ts');
const content = fs.readFileSync(curriculumPath, 'utf8');

// Header
const header = `import { DifficultyLevel, ExampleCase, HiddenTestCase, StarterTemplates } from "@/types";
import { generateDefaultStarterTemplates } from "./starterTemplates";

export interface QuestionSeedItem {
  problemId: string;
  title: string;
  slug: string;
  phase: number;
  difficulty: DifficultyLevel;
  description: string;
  constraints: string[];
  examples: ExampleCase[];
  starterTemplates: StarterTemplates;
  tags: string[];
  xp: number;
  hiddenTestCases: HiddenTestCase[];
  isPublished: boolean;
}

export function createSeedQuestion(
  idNum: number,
  title: string,
  phase: number,
  difficulty: DifficultyLevel,
  description: string,
  sampleInput: string,
  sampleOutput: string,
  hiddenTests: HiddenTestCase[],
  constraints: string[] = ["-10^9 <= N <= 10^9"],
  tags: string[] = []
): QuestionSeedItem {
  const problemId = idNum.toString().padStart(3, "0");
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, "")
    .trim()
    .replace(/\\s+/g, "-")
    .slice(0, 80);

  const xp = difficulty === "Hard" ? 30 : difficulty === "Medium" ? 20 : 10;
  const phaseNames = [
    "Conditional Thinking",
    "Looping and Patterns",
    "Recursion",
    "Basic Arrays",
    "Strings",
    "Mixed Logical Challenges",
  ];

  return {
    problemId,
    title,
    slug: \`\${problemId}-\${slug}\`,
    phase,
    difficulty,
    description: \`\${description}\\n\\nInput Format:\\nRead input from standard input (stdin).\\n\\nOutput Format:\\nPrint the result to standard output (stdout).\`,
    constraints,
    examples: [
      {
        input: sampleInput,
        output: sampleOutput,
        explanation: \`Sample execution for input \${sampleInput || "(no input)"}\`,
      },
    ],
    starterTemplates: generateDefaultStarterTemplates(title),
    tags: [phaseNames[phase - 1], difficulty, ...tags],
    xp,
    hiddenTestCases: hiddenTests.length > 0 ? hiddenTests : [{ input: sampleInput, expectedOutput: sampleOutput }],
    isPublished: true,
  };
}

export const CURRICULUM_QUESTIONS: QuestionSeedItem[] = [
`;

// Extract blocks by matching createSeedQuestion(ID, ...
// We can find all occurrences of "createSeedQuestion("
const calls = [];
let searchIdx = 0;
while (true) {
  const idx = content.indexOf('createSeedQuestion(', searchIdx);
  if (idx === -1) break;
  // find end of call: look for next "createSeedQuestion(" or end of CURRICULUM_QUESTIONS
  const nextIdx = content.indexOf('createSeedQuestion(', idx + 19);
  let chunk = '';
  if (nextIdx === -1) {
    const endArr = content.indexOf('];', idx);
    chunk = content.slice(idx, endArr);
  } else {
    chunk = content.slice(idx, nextIdx);
  }
  // Trim trailing comma and whitespace
  chunk = chunk.trim();
  if (chunk.endsWith(',')) chunk = chunk.slice(0, -1).trim();

  // match ID
  const m = chunk.match(/createSeedQuestion\(\s*(\d+)\s*,/);
  if (m) {
    const id = parseInt(m[1]);
    calls.push({ id, chunk });
  }
  searchIdx = idx + 19;
}

console.log('Total calls extracted:', calls.length);

const byId = {};
calls.forEach(c => byId[c.id] = c.chunk);

// Helper to remap ID and Phase in a chunk
function remapChunk(chunk, newId, newPhase) {
  let updated = chunk.replace(/createSeedQuestion\(\s*\d+\s*,/, `createSeedQuestion(${newId},`);
  // replace phase parameter: createSeedQuestion(newId, "title", phase,
  // We can regex replace the 3rd argument
  updated = updated.replace(
    /(createSeedQuestion\(\s*\d+\s*,\s*(?:"(?:[^"\\]|\\.)*"|'[^']*')\s*,\s*)\d+(\s*,)/,
    `$1${newPhase}$2`
  );
  return updated;
}

const reorderedChunks = [];

// 1 - 20 (Phase 1)
for (let i = 1; i <= 20; i++) {
  if (byId[i]) reorderedChunks.push(byId[i]);
}

// 21 - 30: Basic Looping (Phase 2, was 51 - 60)
for (let i = 51; i <= 60; i++) {
  const newId = i - 30; // 51 -> 21
  if (byId[i]) reorderedChunks.push(remapChunk(byId[i], newId, 2));
}

// 31 - 40: Math & Number Logic (Phase 1, was 21 - 30)
for (let i = 21; i <= 30; i++) {
  const newId = i + 10; // 21 -> 31
  if (byId[i]) reorderedChunks.push(remapChunk(byId[i], newId, 1));
}

// 41 - 50: Logical Operators & Compound Statements (Phase 1, was 31 - 40)
for (let i = 31; i <= 40; i++) {
  const newId = i + 10; // 31 -> 41
  if (byId[i]) reorderedChunks.push(remapChunk(byId[i], newId, 1));
}

// 51 - 60: Creative / Tricky Scenarios (Phase 1, was 41 - 50)
for (let i = 41; i <= 50; i++) {
  const newId = i + 10; // 41 -> 51
  if (byId[i]) reorderedChunks.push(remapChunk(byId[i], newId, 1));
}

// 61 - 70: Number-based Looping Logic (Phase 2, was 61 - 70)
for (let i = 61; i <= 70; i++) {
  if (byId[i]) reorderedChunks.push(byId[i]);
}

// Questions 71 - 80: Mathematical & Logical Patterns (Phase 2)
const q71_80 = [
  `  createSeedQuestion(71, "Squares from 1 to N", 2, "Easy", "Given positive integer N, print squares of numbers from 1 to N separated by space.", "5", "1 4 9 16 25", [
    { input: "5", expectedOutput: "1 4 9 16 25" },
    { input: "3", expectedOutput: "1 4 9" },
    { input: "1", expectedOutput: "1" }
  ])`,
  `  createSeedQuestion(72, "Cubes from 1 to N", 2, "Easy", "Given positive integer N, print cubes of numbers from 1 to N separated by space.", "4", "1 8 27 64", [
    { input: "4", expectedOutput: "1 8 27 64" },
    { input: "1", expectedOutput: "1" },
    { input: "5", expectedOutput: "1 8 27 64 125" }
  ])`,
  `  createSeedQuestion(73, "Numbers Between A and B Divisible by 7", 2, "Easy", "Given two integers A and B (A <= B) on separate lines, print all numbers between A and B inclusive that are divisible by 7, separated by space.", "10\\n30", "14 21 28", [
    { input: "10\\n30", expectedOutput: "14 21 28" },
    { input: "1\\n14", expectedOutput: "7 14" },
    { input: "20\\n25", expectedOutput: "21" }
  ])`,
  `  createSeedQuestion(74, "GCD / HCF of Two Numbers", 2, "Medium", "Given two positive integers A and B on separate lines, find their Greatest Common Divisor (GCD) using loops.", "12\\n18", "6", [
    { input: "12\\n18", expectedOutput: "6" },
    { input: "7\\n13", expectedOutput: "1" },
    { input: "24\\n36", expectedOutput: "12" }
  ])`,
  `  createSeedQuestion(75, "LCM of Two Numbers", 2, "Medium", "Given two positive integers A and B on separate lines, find their Least Common Multiple (LCM) using loops.", "4\\n6", "12", [
    { input: "4\\n6", expectedOutput: "12" },
    { input: "3\\n5", expectedOutput: "15" },
    { input: "12\\n18", expectedOutput: "36" }
  ])`,
  `  createSeedQuestion(76, "Print All Factors of a Number", 2, "Easy", "Given positive integer N, print all factors of N in ascending order separated by space.", "12", "1 2 3 4 6 12", [
    { input: "12", expectedOutput: "1 2 3 4 6 12" },
    { input: "7", expectedOutput: "1 7" },
    { input: "16", expectedOutput: "1 2 4 8 16" }
  ])`,
  `  createSeedQuestion(77, "Sum of All Factors", 2, "Medium", "Given positive integer N, find the sum of all factors of N.", "6", "12", [
    { input: "6", expectedOutput: "12" },
    { input: "12", expectedOutput: "28" },
    { input: "1", expectedOutput: "1" }
  ])`,
  `  createSeedQuestion(78, "Strong Number Check", 2, "Hard", "Check whether a given positive integer N is a Strong number (sum of factorials of its digits equals N). Print 'Yes' or 'No'.", "145", "Yes", [
    { input: "145", expectedOutput: "Yes" },
    { input: "120", expectedOutput: "No" },
    { input: "2", expectedOutput: "Yes" }
  ])`,
  `  createSeedQuestion(79, "First N Terms of AP", 2, "Easy", "Given N, first term A, and common difference D on separate lines, print first N terms of Arithmetic Progression separated by space.", "5\\n2\\n3", "2 5 8 11 14", [
    { input: "5\\n2\\n3", expectedOutput: "2 5 8 11 14" },
    { input: "4\\n1\\n2", expectedOutput: "1 3 5 7" },
    { input: "3\\n10\\n-2", expectedOutput: "10 8 6" }
  ])`,
  `  createSeedQuestion(80, "First N Terms of GP", 2, "Easy", "Given N, first term A, and common ratio R on separate lines, print first N terms of Geometric Progression separated by space.", "4\\n2\\n3", "2 6 18 54", [
    { input: "4\\n2\\n3", expectedOutput: "2 6 18 54" },
    { input: "3\\n1\\n2", expectedOutput: "1 2 4" },
    { input: "4\\n5\\n2", expectedOutput: "5 10 20 40" }
  ])`
];

reorderedChunks.push(...q71_80);

const fullOutput = header + reorderedChunks.map(c => c.trim()).join(',\n\n') + '\n];\n';
fs.writeFileSync(curriculumPath, fullOutput, 'utf8');
console.log(`Successfully rewrote ${curriculumPath} with ${reorderedChunks.length} questions (001 - 080).`);
