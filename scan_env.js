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

console.log('--- Filtered env-like strings ---');
const envVars = uniqueStrings.filter(s => /^[A-Z][A-Z0-9_]{4,40}$/.test(s));
console.log(envVars.filter(s => s.includes('URL') || s.includes('PORT') || s.includes('SERVICE') || s.includes('KEY') || s.includes('AUD') || s.includes('API') || s.includes('JWT')));
