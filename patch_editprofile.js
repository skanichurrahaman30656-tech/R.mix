const fs = require('fs');
let code = fs.readFileSync('components/EditProfileModal.tsx', 'utf8');

// Fix handleImageSelect
code = code.replace(
  `    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }`,
  `    const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
    if (!isImage) {
      setError("Unsupported file type. Allowed types: JPG, PNG, WEBP.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("Image must be less than 100MB");
      return;
    }`
);

// Fix uploadImage path
code = code.replace(
  `    const fileName = \`\${user.id}-\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExt}\`;`,
  `    const fileName = \`\${user.id}/\${Date.now()}-\${Math.random().toString(36).substring(7)}.\${fileExt}\`;`
);

fs.writeFileSync('components/EditProfileModal.tsx', code);
