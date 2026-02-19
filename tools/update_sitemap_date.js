const fs = require('fs');
const path = require('path');

const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
let content = fs.readFileSync(sitemapPath, 'utf8');

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
console.log(`Updating sitemap lastmod to: ${today}`);

// Regex to match <lastmod>YYYY-MM-DD</lastmod>
const regex = /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g;
const newContent = content.replace(regex, `<lastmod>${today}</lastmod>`);

if (content !== newContent) {
    fs.writeFileSync(sitemapPath, newContent, 'utf8');
    console.log('Sitemap updated successfully.');
} else {
    console.log('No changes needed.');
}
