const fs = require('fs');

const files = [
  'components/CreatePostModal.tsx',
  'components/EditProfileModal.tsx',
  'components/MainDashboardClient.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import Image from')) {
    content = content.replace("import React", "import Image from 'next/image';\nimport React");
  }
  
  content = content.replace(/<img\b/g, '<Image width={500} height={500}');
  fs.writeFileSync(file, content);
});
