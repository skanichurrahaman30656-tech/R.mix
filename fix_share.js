const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// We need to add handleShare function
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
  "const handleToggleComments = (postId: string) => {",
  handleShareFn + "\n  const handleToggleComments = (postId: string) => {"
);

// In Reels
code = code.replace(
  "onClick={() => alert('Reel link copied to clipboard!')}",
  "onClick={() => handleShare(reelItem.id)}"
);

// In Feed
code = code.replace(
  "onClick={() => alert('Post link copied to clipboard!')}",
  "onClick={() => handleShare(post.id)}"
);

// Also need to fix the toast: "Opened {activeSettingToast}" -> "{activeSettingToast}" or something?
// Actually if it says "Opened Shared successfully", that's weird.
// Let's replace "Opened {activeSettingToast}" with just "{activeSettingToast}"
code = code.replace(
  /<span>Opened \{activeSettingToast\}<\/span>/g,
  "<span>{activeSettingToast}</span>"
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
