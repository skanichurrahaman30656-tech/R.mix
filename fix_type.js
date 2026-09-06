const fs = require('fs');
let content = fs.readFileSync('lib/recommendations.ts', 'utf8');

// I'm completely removing the logic for suppressing posts for now to restore everything 
content = content.replace(
  /const totalPostImpressions = events\.filter\(\(e\) => e\.event_type === 'impression'\)\.length;/g,
  ``
);

// We need to keep totalPostImpressions for the metrics object
content = content.replace(
  /let audienceReachAllowed = true;/g,
  `let audienceReachAllowed = true;
      const totalPostImpressions = events.filter((e) => e.event_type === 'impression').length;`
);

fs.writeFileSync('lib/recommendations.ts', content);
console.log("Fixed type");
