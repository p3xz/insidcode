const fs = require('fs');
const path = require('path');

// Read question.md
const questionMd = fs.readFileSync(path.join(__dirname, '..', 'question.md'), 'utf8');
const lines = questionMd.split('\n');

const allMeta = {};
let currentStage = '';
let currentSection = '';

for (const line of lines) {
  if (line.startsWith('## STAGE')) currentStage = line.replace('##', '').trim();
  else if (line.startsWith('### ')) currentSection = line.replace('###', '').trim();
  else {
    const m = line.match(/^(\d+)\.\s+\[(Easy|Medium|Hard)\]\s+(.*)$/);
    if (m) {
      const id = parseInt(m[1]);
      allMeta[id] = {
        id,
        diff: m[2],
        title: m[3].trim(),
        stage: currentStage,
        section: currentSection,
      };
    }
  }
}

console.log('Loaded metadata for', Object.keys(allMeta).length, 'questions.');

function escapeStr(s) {
  return JSON.stringify(s);
}

function generateQuestionCode(meta, phase, desc, sampleInput, sampleOutput, hiddenTests) {
  const cleanTitle = meta.title.replace(/["\\]/g, '\\$&').replace(/\$/g, '');
  const testsCode = hiddenTests.map(t => `    { input: ${escapeStr(t.input)}, expectedOutput: ${escapeStr(t.output)} }`).join(',\n');
  return `  createSeedQuestion(${meta.id}, "${cleanTitle}", ${phase}, "${meta.diff}", ${escapeStr(desc)}, ${escapeStr(sampleInput)}, ${escapeStr(sampleOutput)}, [
${testsCode}
  ])`;
}

// Export helper for modules
function fileHeader(exportName) {
  return `import { QuestionSeedItem, createSeedQuestion } from "./curriculumData";

export const ${exportName}: QuestionSeedItem[] = [
`;
}

function fileFooter() {
  return `];\n`;
}

module.exports = {
  allMeta,
  escapeStr,
  generateQuestionCode,
  fileHeader,
  fileFooter,
};
