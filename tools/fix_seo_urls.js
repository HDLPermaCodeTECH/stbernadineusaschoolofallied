const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const oldUrlBase = 'https://hdlpermacodetech.github.io/stbernadineusaschoolofallied';
const newUrlBase = 'https://www.stbernadineschoolofallied.com';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'uploads') {
                walkDir(dirPath, callback);
            }
        } else {
            callback(path.join(dir, f));
        }
    });
}

console.log(`Starting SEO URL fix...`);
console.log(`Old: ${oldUrlBase}`);
console.log(`New: ${newUrlBase}`);

let count = 0;

walkDir(rootDir, (filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.xml') || filePath.endsWith('robots.txt')) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Check if file contains the old URL
        if (content.includes('hdlpermacodetech.github.io')) {
            // Replace all occurrences
            // We need to handle potential trailing slashes carefully or just do a global replace of the base string
            const regex = new RegExp('https://hdlpermacodetech.github.io/stbernadineusaschoolofallied', 'g');
            const newContent = content.replace(regex, newUrlBase);

            if (content !== newContent) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`Updated: ${path.relative(rootDir, filePath)}`);
                count++;
            }
        }
    }
});

console.log(`\nSuccess! Updated ${count} files.`);
