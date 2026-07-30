const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

const target = `      {/* Create Post Modal */}
      {user && (
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          user={user}
          onPostCreated={() => fetchPosts(user.id)}
        />
      )}`;

code = code.replace(target, '');
fs.writeFileSync('components/MainDashboardClient.tsx', code);
