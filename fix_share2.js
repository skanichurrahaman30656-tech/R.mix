const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

const handleShareFn = `
  const handleShare = async (postId: string) => {
    const url = \`\${window.location.origin}?post=\${postId}\`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post',
          url: url
        });
        setActiveSettingToast('Shared successfully');
        setTimeout(() => setActiveSettingToast(null), 2000);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      setActiveSettingToast('Link copied to clipboard');
      setTimeout(() => setActiveSettingToast(null), 2000);
    }
  };
`;

code = code.replace(
  "const handleToggleComments = (id: string) => {",
  handleShareFn + "\n  const handleToggleComments = (id: string) => {"
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
