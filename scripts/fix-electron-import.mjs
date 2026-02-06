import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainIndexPath = path.resolve(__dirname, '../dist/main/index.js');

// Read the built file
let content = fs.readFileSync(mainIndexPath, 'utf8');

// Replace the problematic require("electron") with a dynamic require
// that forces Node/Electron to use the built-in module
content = content.replace(
    /^const electron = require\("electron"\);/m,
    'const electron = (function() { try { return require("electron"); } catch(e) { return eval(\'require("electron")\'); } })();'
);

// Write back
fs.writeFileSync(mainIndexPath, content, 'utf8');

console.log('✓ Patched dist/main/index.js to fix electron module resolution');
