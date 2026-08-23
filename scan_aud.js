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
    if (currentString.length >= 4) {
      strings.push(currentString.join(''));
    }
    currentString = [];
  }
}

const uniqueStrings = [...new Set(strings)];

console.log('--- Searching for URLs and Cloud Run domains ---');
const urls = uniqueStrings.filter(s => s.includes('http://') || s.includes('https://') || s.includes('.run.app') || s.includes('google'));
console.log(urls.slice(0, 100));

console.log('--- Searching for environment variables or aud keys ---');
const auds = uniqueStrings.filter(s => s.toLowerCase().includes('aud') || s.toLowerCase().includes('audience') || s.toLowerCase().includes('token'));
console.log(auds.slice(0, 100));
