const fs = require('fs');

let code = fs.readFileSync('app/signup/page.tsx', 'utf8');

code = code.replace(
  /if \(uploadError\) \{\n\s*console\.error\("Avatar upload error:", uploadError\);\n\s*\}/g,
  `if (uploadError) {
            console.error("Avatar upload error:", uploadError);
            if (uploadError.message.includes('security policy') || uploadError.message.includes('row-level')) {
              // Ignore and use default dicebear avatar since storage isn't configured
            }
          }`
);

fs.writeFileSync('app/signup/page.tsx', code);
