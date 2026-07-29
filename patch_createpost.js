const fs = require('fs');
let code = fs.readFileSync('components/CreatePostModal.tsx', 'utf8');

// Fix handleFileSelect
code = code.replace(
  `      const isVideo = file.type.startsWith("video/mp4") || file.type.startsWith("video/quicktime") || file.type.startsWith("video/webm");
      const isImage = file.type.startsWith("image/");

      if (!isVideo && !isImage) {
        setError(\`Unsupported file type: "\${file.name}". Please upload MP4/WebM videos or standard images.\`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError(\`File "\${file.name}" exceeds the 50MB limit.\`);
        continue;
      }`,
  `      const isVideo = ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type);
      const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);

      if (!isVideo && !isImage) {
        setError(\`Unsupported file type: "\${file.name}". Allowed types: JPG, PNG, WEBP, MP4, MOV, WEBM.\`);
        continue;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError(\`File "\${file.name}" exceeds the 100MB limit.\`);
        continue;
      }`
);

// Fix uploadFile bucket and path
code = code.replace(
  `  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = \`\${user.id}-\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExt}\`;
    const { data, error } = await supabase.storage
      .from("media")
      .upload(fileName, file, {
        upsert: false,
        cacheControl: "3600",
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(data.path);
    return publicUrl;
  };`,
  `  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = \`\${user.id}/\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExt}\`;
    const { data, error } = await supabase.storage
      .from("post-media")
      .upload(fileName, file, {
        upsert: false,
        cacheControl: "3600",
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("post-media").getPublicUrl(data.path);
    return publicUrl;
  };`
);

fs.writeFileSync('components/CreatePostModal.tsx', code);
