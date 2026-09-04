const fs = require('fs');
if (fs.existsSync('pages')) {
  console.log("Pages directory exists:");
  console.log(fs.readdirSync('pages'));
} else {
  console.log("No pages directory.");
}
