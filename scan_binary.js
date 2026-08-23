const fs = require('fs');

async function main() {
  const binaryPath = '/app/control-plane-api/control-plane-api';
  if (!fs.existsSync(binaryPath)) {
    console.error('Binary does not exist at', binaryPath);
    return;
  }
  const buffer = fs.readFileSync(binaryPath);
  console.log('Binary loaded, scanning for strings...');

  // Search for ascii sequences of length 4 to 100
  let currentString = [];
  const strings = [];
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if (byte >= 32 && byte <= 126) {
      currentString.push(String.fromCharCode(byte));
    } else {
      if (currentString.length >= 6) {
        strings.push(currentString.join(''));
      }
      currentString = [];
    }
  }

  console.log(`Found ${strings.length} strings in binary.`);
  
  // Filter for interesting terms
  const terms = ['auth', 'bearer', 'token', 'key', 'migration', '/api', 'admin', 'schema', 'headers'];
  const matched = strings.filter(str => {
    const lower = str.toLowerCase();
    return terms.some(term => lower.includes(term));
  });

  console.log('\nMatched strings (first 200):');
  console.log(matched.slice(0, 200).join('\n'));
}

main();
