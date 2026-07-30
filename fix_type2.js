const fs = require('fs');
let code = fs.readFileSync('components/SettingsSystem.tsx', 'utf8');

code = code.replace(
  `const val = document.getElementById('new_pass').value;`,
  `const val = (document.getElementById('new_pass') as HTMLInputElement)?.value;`
);

code = code.replace(
  `const val = document.getElementById('new_email').value;`,
  `const val = (document.getElementById('new_email') as HTMLInputElement)?.value;`
);

fs.writeFileSync('components/SettingsSystem.tsx', code);
