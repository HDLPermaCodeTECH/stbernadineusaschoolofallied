const fs = require('fs');
const path = require('path');

const rootDir = '.'; // Running from project root
const baseUrl = 'https://www.stbernadineschoolofallied.com';
const defaultImage = `${baseUrl}/asset/images/logo.png`;
const siteName = 'St. Bernadine School of Allied Health';

// List of HTML files to process
const files = [
    'index.html',
    'about.html',
    'cna-program.html',
    'ch-hha-program.html',
    'pct-program.html',
    'ekg-phlebotomy-program.html',
    'medical-assistant-program.html',
    'pharmacy-technician-program.html', // If exists
    'billing-coding-program.html', // If exists
    'cma-program.html',
    'cpr-program.html',
    'newborn-care-program.html',
    'clinical-skills.html',
    'continuing-education.html',
    'services.html',
    'home-care.html',
    'placement.html',
    'agency-news.html',
    'career-advice.html',
    'blog.html',
    'contact.html',
    'inquiry.html',
    'referral.html',
    'apply.html',
    'tuition.html',
    'payment.html',
    'forms.html',
    'privacy.html',
    'terms.html',
    'student-life.html',
    'promo-video.html'
];

files.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`Skipping (not found): ${file}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Extract Title
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : siteName;

    // Extract Description
    const descMatch = content.match(/<meta name="description"\s+content="(.*?)"/i);
    const description = descMatch ? descMatch[1] : `Start your healthcare career at ${siteName}.`;

    // Construct Canonical URL
    const url = file === 'index.html' ? `${baseUrl}/` : `${baseUrl}/${file}`;

    // Construct New Social Meta Tags
    const socialTags = `
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${defaultImage}">
    <meta property="og:site_name" content="${siteName}">
    <meta property="og:locale" content="en_US">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${defaultImage}">`;

    // Remove existing Open Graph and Twitter tags to prevent duplicates
    content = content.replace(/<meta property="og:[^>]*>/gi, '');
    content = content.replace(/<meta property="twitter:[^>]*>/gi, '');
    content = content.replace(/<!-- Open Graph \/ Facebook -->/gi, ''); // Remove old comments
    content = content.replace(/<!-- Twitter -->/gi, ''); // Remove old comments

    // Clean up empty lines left by removal (optional, simple regex)
    content = content.replace(/^\s*[\r\n]/gm, '');

    // Inject new tags before </head>
    if (content.includes('</head>')) {
        content = content.replace('</head>', `${socialTags}\n</head>`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated Social Tags: ${file}`);
    } else {
        console.error(`Error: No </head> tag found in ${file}`);
    }
});

console.log('Social Media Optimization Complete! 🚀');
