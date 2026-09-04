const fs = require('fs');
const execSync = require('child_process').execSync;
const output = execSync('grep -r "import.*Html" app components lib').toString();
console.log(output);
