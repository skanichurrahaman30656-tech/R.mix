const fs = require('fs');

let content = fs.readFileSync('components/settings/SettingsSystem.tsx', 'utf8');

content = content.replace(
  /\} else if \(item\.id === 'terms'\) \{\s*window\.open\('\/privacy', '_blank'\);\s*\}/,
  ""
);

// add terms to validMenus
content = content.replace(
  /\['account_privacy'/,
  "['terms', 'account_privacy'"
);

content = content.replace(
  /\{activeMenu === 'help' && \(/,
  `{activeMenu === 'terms' && (
          <div className="space-y-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
             <h3 className="text-white font-semibold mb-2">Terms & Privacy Policy</h3>
             <div className="text-sm text-zinc-400 max-h-64 overflow-y-auto space-y-4 pr-2">
               <p><strong>1. Introduction</strong><br/>Welcome to R.mix. By using our platform, you agree to these terms.</p>
               <p><strong>2. Privacy</strong><br/>We are committed to protecting your privacy and security. We only collect essential data required to provide our services.</p>
               <p><strong>3. User Content</strong><br/>You retain all rights to the content you post, but grant us a license to display it.</p>
               <p><strong>4. Conduct</strong><br/>We do not tolerate harassment, spam, or abusive behavior.</p>
             </div>
          </div>
        )}
        {activeMenu === 'help' && (`
);

fs.writeFileSync('components/settings/SettingsSystem.tsx', content);
console.log("Terms fixed.");
