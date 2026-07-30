const fs = require('fs');
let code = fs.readFileSync('components/CreatePostModal.tsx', 'utf8');

// Replace uploadImage function body to fallback to base64 on RLS error
code = code.replace(/const uploadImage = async \(file: File\) => \{[\s\S]*?return publicUrl;\n  \};/g, 
`const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = \`\${user.id}-\${Math.random()}.\${fileExt}\`;

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
            reader.onload = () => resolve(reader.result);
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
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
          });
      }
      throw err;
    }
  };`);

// also handle post error 
code = code.replace(
  /if \(postError\) throw postError;/g,
  `if (postError) {
        if (postError.message.includes('security policy') || postError.message.includes('row-level')) {
            throw new Error("Cannot create post: RLS policy is blocking inserts. Please ensure 'posts' table allows inserts where user_id = auth.uid().");
        }
        throw postError;
      }`
);

fs.writeFileSync('components/CreatePostModal.tsx', code);
