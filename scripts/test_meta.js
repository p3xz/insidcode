const fs = require('fs');
const path = require('path');

// Read question.md to verify titles and metadata
const questionMd = fs.readFileSync(path.join(__dirname, '..', 'question.md'), 'utf8');
const lines = questionMd.split('\n');

const qMeta = {};
for (const line of lines) {
  const m = line.match(/^(\d+)\.\s+\[(Easy|Medium|Hard)\]\s+(.*)$/);
  if (m) {
    qMeta[parseInt(m[1])] = {
      id: parseInt(m[1]),
      diff: m[2],
      title: m[3].trim()
    };
  }
}

console.log('Total metadata parsed from question.md:', Object.keys(qMeta).length);
