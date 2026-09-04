const fs = require('fs');

let layout = fs.readFileSync('app/layout.tsx', 'utf8');

// Add meta tag to metadata object
if (!layout.includes('google-adsense-account')) {
  layout = layout.replace(
    /twitter: \{\s*card: "summary_large_image",\s*title: "R\.mix[^}]+},\s*};/m,
    match => match.replace('},', '},\n  other: {\n    "google-adsense-account": "ca-pub-8344189408835852",\n  },')
  );
}

// Add script to head
if (!layout.includes('adsbygoogle.js')) {
  layout = layout.replace(
    /<head>/,
    `<head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8344189408835852" crossOrigin="anonymous"></script>`
  );
}

fs.writeFileSync('app/layout.tsx', layout);
console.log('Updated app/layout.tsx');
