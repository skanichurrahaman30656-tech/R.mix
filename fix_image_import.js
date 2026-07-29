const fs = require('fs');
const files = [
  'components/CreatePostModal.tsx',
  'components/EditProfileModal.tsx',
  'components/MainDashboardClient.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import Image from 'next/image'")) {
    content = content.replace('"use client";', '"use client";\nimport Image from "next/image";');
  }
  fs.writeFileSync(file, content);
});
