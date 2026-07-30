const fs = require('fs');
let code = fs.readFileSync('components/CreatePostModal.tsx', 'utf8');

code = code.replace(/const uploadFile = async \(file: File\): Promise<string> => \{[\s\S]*?return publicUrl;\n  \};/g, 
`const uploadFile = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = \`\${user.id}/\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExt}\`;

      const { data, error } = await supabase.storage
        .from("post-media")
        .upload(fileName, file, {
          upsert: false,
          cacheControl: "3600",
        });

      if (error) {
        if (error.message.includes('security policy') || error.message.includes('row-level')) {
          console.warn('Storage RLS error, falling back to base64');
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
          });
        }
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-media").getPublicUrl(data.path);

      return publicUrl;
    } catch (err: any) {
      if (err.message?.includes('security policy') || err.message?.includes('row-level')) {
          console.warn('Storage RLS error, falling back to base64');
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
          });
      }
      throw err;
    }
  };`);

fs.writeFileSync('components/CreatePostModal.tsx', code);
