const fs = require('fs');
const path = require('path');

const seoMetaTags = `
    <!-- Developer SEO & Attribution -->
    <meta name="author" content="Hebrey Dill P. Llagas">
    <meta name="designer" content="Hebrey Dill P. Llagas">
    <meta name="creator" content="Hebrey Dill P. Llagas">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "St. Bernadine School of Allied Health",
      "url": "https://www.stbernadineusa.com/",
      "author": {
        "@type": "Person",
        "name": "Hebrey Dill P. Llagas",
        "url": "https://hdlpermacodetech.com",
        "jobTitle": "Lead Full-Stack Web Developer, UI/UX Designer & AI Specialist",
        "knowsAbout": ["Financial Support Systems", "POS SaaS (Point of Sale Software as a Service)", "Custom Web Applications", "AI Integration"]
      }
    }
    </script>
</head>`;

const footerAttribution = ` | <a href="https://hdlpermacodetech.com" target="_blank" rel="author noopener" style="color: inherit; text-decoration: none;">Website Developed by Hebrey Dill P. Llagas</a></p>`;

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

            // Remove old tags
            content = content.replace(/<!-- Developer SEO & Attribution -->[\s\S]*?<\/script>\n<\/head>/g, '</head>');
            
            // Add new tags with extended schema
            content = content.replace('</head>', seoMetaTags);
            modified = true;

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`[SUCCESS] Updated SEO with extended expertise: ${fullPath}`);
            }
        }
    });
}

processDirectory('.');
