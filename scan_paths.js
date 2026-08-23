const fs = require('fs');

async function main() {
  const binaryPath = '/app/control-plane-api/control-plane-api';
  if (!fs.existsSync(binaryPath)) return;
  const buffer = fs.readFileSync(binaryPath);

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

  // Filter for endpoints
  const apiPaths = strings.filter(str => str.startsWith('/') && str.length > 2 && !str.includes('//'));
  console.log('Paths found in binary:');
  console.log([...new Set(apiPaths)].filter(p => p.includes('api') || p.includes('health') || p.includes('db')).slice(0, 100));

  // Let's also look for any string that starts with "X-"
  const xHeaders = strings.filter(str => str.startsWith('X-') || str.startsWith('x-'));
  console.log('\nX- Headers found in binary:');
  console.log([...new Set(xHeaders)].slice(0, 50));
}

main();
