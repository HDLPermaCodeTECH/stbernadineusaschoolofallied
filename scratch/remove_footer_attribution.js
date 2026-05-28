const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'scratch') {
                processDirectory(fullPath);
            }
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // This regex finds the pipeline and the anchor tag containing the developer attribution
            const regex = /\s*\|\s*<a href="https:\/\/hdlpermacodetech\.com"[^>]*>.*?<\/a>/ig;
            
            if (regex.test(content)) {
                content = content.replace(regex, '');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`[SUCCESS] Removed obvious attribution from: ${fullPath}`);
            }
        }
    });
}

processDirectory('.');
console.log('Finished removing developer attribution from footers.');
