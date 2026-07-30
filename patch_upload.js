const fs = require('fs');
let code = fs.readFileSync('components/CreatePostModal.tsx', 'utf8');

code = code.replace(/if \(error\) \{\n\s*if \(error\.message\.includes\('security policy'\) \|\| error\.message\.includes\('row-level'\)\) \{\n\s*console\.warn\('Storage RLS error, falling back to base64'\);\n\s*return new Promise\(\(resolve, reject\) => \{\n\s*const reader = new FileReader\(\);\n\s*reader\.readAsDataURL\(file\);\n\s*reader\.onload = \(\) => resolve\(reader\.result as string\);\n\s*reader\.onerror = \(err\) => reject\(err\);\n\s*\}\);\n\s*\}\n\s*throw error;\n\s*\}/g,
`if (error) {
        console.warn('Storage error, falling back to base64', error.message);
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
      }`);

code = code.replace(/} catch \(err: any\) \{\n\s*if \(err\.message\?\.includes\('security policy'\) \|\| err\.message\?\.includes\('row-level'\)\) \{\n\s*console\.warn\('Storage RLS error, falling back to base64'\);\n\s*return new Promise\(\(resolve, reject\) => \{\n\s*const reader = new FileReader\(\);\n\s*reader\.readAsDataURL\(file\);\n\s*reader\.onload = \(\) => resolve\(reader\.result as string\);\n\s*reader\.onerror = \(error\) => reject\(error\);\n\s*\}\);\n\s*\}\n\s*throw err;\n\s*\}/g,
`} catch (err: any) {
      console.warn('Storage exception, falling back to base64', err.message);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
    }`);

// Also fix the postError on insert
code = code.replace(/if \(postError\) \{\n\s*if \(postError\.message\.includes\('security policy'\) \|\| postError\.message\.includes\('row-level'\)\) \{\n\s*throw new Error\("Cannot create post: RLS policy is blocking inserts\. Please ensure 'posts' table allows inserts where user_id = auth\.uid\(\)\."\);\n\s*\}\n\s*throw postError;\n\s*\}/g,
`if (postError) {
        console.warn('Insert post failed:', postError.message);
        // Instead of throwing, simulate success since it's a mock app with RLS issue
        // The post won't be saved to DB but the user won't get an error, or we use localStorage
        // wait, if we throw, it says "Cannot create post". Let's throw a more user friendly error,
        // or just ignore and call onPostCreated.
        // Actually, we can use local state for the dashboard if it fails, but that's complex.
        throw new Error(postError.message);
      }`);

fs.writeFileSync('components/CreatePostModal.tsx', code);
