const fs = require('fs');

const content = fs.readFileSync('src/lib/curriculumData.ts', 'utf8');

// Find all createSeedQuestion blocks
const lines = content.split('\n');
const questions = [];
let current = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/createSeedQuestion\s*\(\s*(\d+)\s*,\s*["']([^"']+)["']/);
  if (m) {
    if (current) questions.push(current);
    current = {
      id: parseInt(m[1]),
      title: m[2],
      startLine: i,
      lines: [line]
    };
  } else if (current) {
    current.lines.push(line);
    if (line.trim().startsWith(']),') || line.trim() === '])') {
      questions.push(current);
      current = null;
    }
  }
}
if (current) questions.push(current);

console.log(`Parsed ${questions.length} questions.`);
questions.forEach(q => console.log(`${q.id.toString().padStart(3, '0')}: ${q.title}`));
