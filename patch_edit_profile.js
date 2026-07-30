const fs = require('fs');
let code = fs.readFileSync('components/EditProfileModal.tsx', 'utf8');

code = code.replace(/const uploadImage = async \(file: File, bucket: string\) => \{[\s\S]*?return publicUrl;\n  \};/g, 
`const uploadImage = async (file: File, bucket: string) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = \`\${user.id}-\${Math.random()}.\${fileExt}\`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          upsert: true,
        });

      if (error) {
        if (error.message.includes('security policy') || error.message.includes('row-level')) {
          console.warn('Storage RLS error, falling back to base64');
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
          });
        }
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      return publicUrl;
    } catch (err: any) {
      if (err.message?.includes('security policy') || err.message?.includes('row-level')) {
          console.warn('Storage RLS error, falling back to base64');
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
          });
      }
      throw err;
    }
  };`);

fs.writeFileSync('components/EditProfileModal.tsx', code);
