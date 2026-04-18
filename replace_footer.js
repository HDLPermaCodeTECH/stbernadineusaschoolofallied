const fs = require('fs');
const path = require('path');

/**
 * RE-APPLICATION SCRIPT: Footer Programs Cleanup
 * This script ensures that specific program links are removed from the footer
 * and replaced by a single "More" link across all HTML files.
 */

const programsToRemove = [
    'medical-assistant-program.html',
    'ekg-phlebotomy-program.html',
    'cpr-program.html',
    'newborn-care-program.html',
    'continuing-education.html'
];

const moreLink = '<li><a href="school-of-allied-health-services/#certification-programs">More <i class="fa-solid fa-arrow-right"></i></a></li>';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
let count = 0;

files.forEach(file => {
    const filePath = path.join('.', file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Identify the Programs footer section
    // Look for <h3>Programs</h3> followed by <ul>...</ul>
    const regex = /(<h3>Programs<\/h3>\s*<ul>)([\s\S]*?)(<\/ul>)/gi;

    content = content.replace(regex, (match, prefix, listContent, suffix) => {
        let newListContent = listContent;
        let removedSomething = false;

        // 2. Remove specified items
        programsToRemove.forEach(prog => {
            const itemRegex = new RegExp(`<li>\\s*<a[^>]*href="${prog}"[^>]*>[\\s\\S]*?<\\/a>\\s*<\\/li>`, 'gi');
            if (itemRegex.test(newListContent)) {
                newListContent = newListContent.replace(itemRegex, '');
                removedSomething = true;
                modified = true;
            }
        });

        // 3. Ensure "More" link exists exactly once
        if (!newListContent.includes('school-of-allied-health-services/#certification-programs')) {
            newListContent = newListContent.trimEnd() + '\n                        ' + moreLink + '\n                    ';
            modified = true;
        }

        if (modified) {
            return prefix + newListContent + suffix;
        }
        return match;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[SUCCESS] Updated: ${file}`);
        count++;
    } else {
        // Log even if already correct to show we checked
        console.log(`[VERIFIED] Already correct: ${file}`);
    }
});

console.log(`\nDONE: ${count} files actually modified. All files verified.`);
