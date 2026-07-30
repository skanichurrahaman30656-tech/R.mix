const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

code = code.replace(/const \{ data: uploadData, error: uploadError \} = await supabase\.storage\n\s*\.from\('media'\)\n\s*\.upload\(fileName, finalFile, \{ upsert: false \}\);\n\n\s*if \(uploadError\) throw uploadError;\n\n\s*const \{ data: \{ publicUrl \} \} = supabase\.storage\n\s*\.from\('media'\)\n\s*\.getPublicUrl\(uploadData\.path\);/g,
`const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, finalFile, { upsert: false });

      let publicUrl = '';
      if (uploadError) {
        console.warn('Storage error, falling back to base64', uploadError.message);
        publicUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(finalFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
      } else if (uploadData) {
        const { data } = supabase.storage
          .from('media')
          .getPublicUrl(uploadData.path);
        publicUrl = data.publicUrl;
      }`);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
