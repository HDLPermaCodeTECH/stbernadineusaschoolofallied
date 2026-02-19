const fs = require('fs');
const path = require('path');

const rootDir = '.'; // Running from project root
const newVersion = '10.27';

// List of HTML files to scan (manually curated to avoid node_modules)
const files = [
    'about.html',
    'agency-news.html',
    'apply.html',
    'blog.html',
    'career-advice.html',
    'ch-hha-program.html',
    'clinical-skills.html',
    'cma-program.html',
    'cna-program.html',
    'contact.html',
    'continuing-education.html',
    'course-catalog.html',
    'cpr-program.html',
    'ekg-phlebotomy-program.html',
    'forms.html',
    'home-care.html',
    'index.html',
    'inquiry.html',
    'medical-assistant-program.html',
    'medical-form.html',
    'newborn-care-program.html',
    'payment.html',
    'pct-program.html',
    'placement.html',
    'privacy.html',
    'promo-video.html',
    'referral.html',
    'services.html',
    'student-life.html',
    'terms.html',
    'tuition-schedule.html',
    'tuition.html'
];

let updatedCount = 0;

files.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Regex to replace version query strings
        // Matches: asset/styles.css?v=ANYTHING
        content = content.replace(/asset\/styles\.css\?v=[0-9.]+/g, `asset/styles.css?v=${newVersion}`);
        // Matches: asset/script.js?v=ANYTHING
        content = content.replace(/asset\/script\.js\?v=[0-9.]+/g, `asset/script.js?v=${newVersion}`);

        // Also catch favicon versions just in case
        content = content.replace(/favicon\.png\?v=[0-9]+/g, `favicon.png?v=21`);
        content = content.replace(/favicon\.ico\?v=[0-9]+/g, `favicon.ico?v=21`);

        // Catch direct reference without query string (add it)
        content = content.replace(/asset\/styles\.css"/g, `asset/styles.css?v=${newVersion}"`);
        content = content.replace(/asset\/script\.js"/g, `asset/script.js?v=${newVersion}"`);

        // Clean up double queries if they happened (e.g. ?v=10.5?v=10.5)
        content = content.replace(/\?v=[0-9.]+\?v=[0-9.]+/g, `?v=${newVersion}`);

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${file}`);
            updatedCount++;
        }
    } else {
        console.warn(`Skipped (not found): ${file}`);
    }
});

console.log(`\nSuccess! Updated ${updatedCount} files to version ${newVersion}.`);
