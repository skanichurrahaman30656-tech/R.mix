const fs = require('fs');

// We have build errors related to "Error: <Html> should not be imported outside of pages/_document."
// This typically happens if the user used next/document or similar in an app router project.
// Let's check for any next/document imports
const checkFiles = ['app/layout.tsx', 'app/not-found.tsx', 'app/error.tsx', 'app/page.tsx'];
for (const file of checkFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('next/document')) {
      console.log(`Found next/document in ${file}`);
    }
  }
}
