const fs = require('fs');
let code = fs.readFileSync('components/EditProfileModal.tsx', 'utf8');

code = code.replace(/const uploadImage = async \(file: File, bucket: string\): Promise<string> => \{[\s\S]*?return publicUrl;\n  \};/g, 
`const uploadImage = async (file: File, bucket: string): Promise<string> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = \`\${user.id}/\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExt}\`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (error) {
        console.warn('Storage error, falling back to base64', error.message);
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicUrl;
    } catch (err: any) {
      console.warn('Storage exception, falling back to base64', err.message);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
    }
  };`);

fs.writeFileSync('components/EditProfileModal.tsx', code);
