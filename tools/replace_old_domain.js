const fs = require('fs');
const path = require('path');

const rootDir = '.'; // Running from project root
const oldDomain = 'stbernadineschoolofallied.com';
const newDomain = 'stbernadineschoolofallied.com';

// List of extensions to scan
const extensions = ['.html', '.js', '.json', '.md'];

// Directories to skip
const skipDirs = ['node_modules', '.git', '.gemini', '.agent'];

function processing(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!skipDirs.includes(file)) {
                processing(filePath);
            }
        } else {
            const ext = path.extname(file).toLowerCase();
            if (extensions.includes(ext)) {
                let content = fs.readFileSync(filePath, 'utf8');

                if (content.includes(oldDomain)) {
                    // Replace all occurrences
                    const regex = new RegExp(oldDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    const newContent = content.replace(regex, newDomain);

                    fs.writeFileSync(filePath, newContent, 'utf8');
                    console.log(`Updated: ${filePath}`);
                }
            }
        }
    });
}

console.log(`Replacing ${oldDomain} with ${newDomain} in all files...`);
processing(rootDir);
console.log('Domain replacement complete.');
