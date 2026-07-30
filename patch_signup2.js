const fs = require('fs');
let code = fs.readFileSync('app/signup/page.tsx', 'utf8');

code = code.replace(/if \(uploadError\) \{\n\s*console\.error\("Avatar upload error:", uploadError\);\n\s*if \(uploadError\.message\.includes\('security policy'\) \|\| uploadError\.message\.includes\('row-level'\)\) \{\n\s*\/\/ Ignore and use default dicebear avatar since storage isn't configured\n\s*\}\n\s*\} else if \(uploadData\) \{/g,
`if (uploadError) {
            console.warn("Avatar upload error, using base64:", uploadError.message);
            finalAvatar = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(avatarFile);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (err) => reject(err);
            });
          } else if (uploadData) {`);

fs.writeFileSync('app/signup/page.tsx', code);
