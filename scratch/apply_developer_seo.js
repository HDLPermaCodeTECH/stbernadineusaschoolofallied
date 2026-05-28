const fs = require('fs');
const path = require('path');

const seoMetaTags = `
    <!-- Developer SEO & Attribution -->
    <meta name="author" content="Hebrey Dill Llagas">
    <meta name="designer" content="Hebrey Dill Llagas">
    <meta name="creator" content="Hebrey Dill Llagas">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "St. Bernadine School of Allied Health",
      "url": "https://www.stbernadineusa.com/",
      "author": {
        "@type": "Person",
        "name": "Hebrey Dill Llagas",
        "url": "https://hdlpermacodetech.com"
      }
    }
    </script>
</head>`;

const footerAttribution = ` | <a href="https://hdlpermacodetech.com" target="_blank" rel="author noopener" style="color: inherit; text-decoration: none;">Developed by Hebrey Dill Llagas</a></p>`;

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
            let modified = false;

            // 1. Add Meta Tags to Head
            if (!content.includes('<meta name="author" content="Hebrey Dill Llagas">')) {
                // If there's already a basic author tag, remove it to avoid duplicates
                content = content.replace(/<meta name="author" content="[^"]*">\s*/i, '');
                
                content = content.replace('</head>', seoMetaTags);
                modified = true;
            }

            // 2. Add Footer Attribution
            if (!content.includes('Developed by Hebrey Dill Llagas')) {
                // Find the footer bottom paragraph end
                content = content.replace(/(<div class="footer-bottom">\s*<p>[\s\S]*?)<\/p>/i, `$1${footerAttribution}`);
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`[SUCCESS] Added SEO to: ${fullPath}`);
            }
        }
    });
}

processDirectory('.');
console.log('Finished applying SEO Developer metadata to all HTML files.');
