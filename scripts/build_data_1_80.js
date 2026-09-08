const fs = require('fs');
const path = require('path');

const curriculumPath = path.join(__dirname, '..', 'src', 'lib', 'curriculumData.ts');
const content = fs.readFileSync(curriculumPath, 'utf8');

// Parse existing questions from curriculumData.ts
const lines = content.split('\n');
const questions = {};
let current = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/createSeedQuestion\s*\(\s*(\d+)\s*,\s*["']([^"']+)["']\s*,\s*(\d+)\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']*)["']\s*,\s*["']([^"']*)["']\s*,\s*["']([^"']*)["']\s*,\s*\[/);
  if (m) {
    if (current) questions[current.id] = current;
    current = {
      id: parseInt(m[1]),
      title: m[2],
      phase: parseInt(m[3]),
      difficulty: m[4],
      description: m[5],
      sampleInput: m[6],
      sampleOutput: m[7],
      hiddenTestsLines: [],
      rawLines: [line]
    };
  } else if (current) {
    current.rawLines.push(line);
    if (line.trim().startsWith(']),') || line.trim() === '])') {
      questions[current.id] = current;
      current = null;
    }
  }
}
if (current) questions[current.id] = current;

console.log('Parsed existing question IDs:', Object.keys(questions).sort((a,b)=>a-b));
