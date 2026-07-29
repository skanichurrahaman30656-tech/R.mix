const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// Fix handleStoryUpload
code = code.replace(
  `      let type = 'image';
      if (file.type.startsWith('image/')) {
        finalFile = await compressImage(file, 1080);
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else {
        throw new Error('Unsupported file type');
      }

      const fileExt = finalFile.name.split('.').pop();
      const fileName = \`\${user.id}-\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExt}\`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, finalFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(uploadData.path);`,
  `      let type = 'image';
      const isVideo = ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type);
      const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);

      if (!isVideo && !isImage) {
        alert("Unsupported file type. Allowed types: JPG, PNG, WEBP, MP4, MOV, WEBM.");
        return;
      }
      
      if (file.size > 100 * 1024 * 1024) {
        alert("File exceeds the 100MB limit.");
        return;
      }

      if (isImage) {
        finalFile = await compressImage(file, 1080);
      } else if (isVideo) {
        type = 'video';
      }

      const fileExt = finalFile.name.split('.').pop();
      const fileName = \`\${user.id}/\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExt}\`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('story-media')
        .upload(fileName, finalFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('story-media')
        .getPublicUrl(uploadData.path);`
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
