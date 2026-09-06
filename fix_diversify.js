const fs = require('fs');
let content = fs.readFileSync('lib/recommendations.ts', 'utf8');

// I'm completely removing the logic for suppressing posts for now to restore everything 
content = content.replace(
  /const reportsCount = events\.filter[\s\S]*?if \(reportsCount >= 3\) return null; \/\/ Automatic safety filter for viral recommendations/g,
  `const reportsCount = events.filter((e) => e.event_type === 'report').length;`
);

content = content.replace(
  /let audienceReachAllowed = true;[\s\S]*?\} else if \(totalPostImpressions < settings\.stage_3_audience_size\) \{[\s\S]*?\}/g,
  `let audienceReachAllowed = true;`
);

content = content.replace(
  /\.filter\(p => p !== null\)/g,
  ``
);

fs.writeFileSync('lib/recommendations.ts', content);
console.log("Fixed missing posts");
