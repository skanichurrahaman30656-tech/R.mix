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

console.log('--- Searching for Google Client ID pattern ---');
const clients = uniqueStrings.filter(s => s.includes('apps.googleusercontent.com') || s.includes('googleusercontent'));
console.log(clients);
