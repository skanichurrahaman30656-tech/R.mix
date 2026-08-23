const fs = require('fs');

const binaryPath = '/app/control-plane-api/control-plane-api';
if (!fs.existsSync(binaryPath)) {
  console.log('Binary not found');
  process.exit(1);
}

const buffer = fs.readFileSync(binaryPath);

let currentString = [];
const strings = [];
for (let i = 0; i < buffer.length; i++) {
  const byte = buffer[i];
  if (byte >= 32 && byte <= 126) {
    currentString.push(String.fromCharCode(byte));
  } else {
    if (currentString.length >= 3) {
      strings.push(currentString.join(''));
    }
    currentString = [];
  }
}

const uniqueStrings = [...new Set(strings)];

console.log('--- Filtering for domains, URLs or metadata keys ---');
const matches = uniqueStrings.filter(s => {
  const l = s.toLowerCase();
  // Filter out Go type descriptors like "*http.Server" or "type:.eq..."
  if (s.includes('*') || s.includes('type:') || s.includes('(') || s.includes(')') || s.includes('[') || s.includes(']')) {
    return false;
  }
  return l.includes('run.app') || l.includes('googleapis.com') || l.includes('aistudio') || l.includes('google.com') || l.includes('metadata') || l.includes('project');
});

console.log(`Found ${matches.length} matches:`);
console.log(matches.slice(0, 100));
