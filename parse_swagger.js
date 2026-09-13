import fs from 'fs';
const swagger = JSON.parse(fs.readFileSync('swagger.json', 'utf8'));
console.log(Object.keys(swagger.definitions || {}));
