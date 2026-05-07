const fs = require('fs');
const targetFile = 'c:/Users/hdlfr/OneDrive/Documents/St. Bernadine Official Website/asset/script.js';
let content = fs.readFileSync(targetFile, 'utf8');

// Use regex to catch the labels by their suffix/query
const topics = [
    { label: '📝 Apply Now', query: 'application' },
    { label: '🏥 Request Care', query: 'request care' },
    { label: '📚 Programs', query: 'programs' },
    { label: '💰 Tuition', query: 'tuition' },
    { label: '🎓 Student Life', query: 'student_life' },
    { label: '🌐 Visa Sponsorship', query: 'visa' },
    { label: '👩‍⚕️ Founder', query: 'founder' },
    { label: '📍 Location', query: 'location' },
    { label: '🤝 Referral', query: 'referral' }
];

topics.forEach(t => {
    // Escape dots and special chars in query if any
    const query = t.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\{ label: '.*?${t.label.split(' ').slice(1).join(' ')}', query: '${query}' \\}`, 'g');
    content = content.replace(regex, `{ label: '${t.label}', query: '${t.query}' }`);
});

// Also fix standard knowledge base emojis
const kbFixes = [
    { from: /ðŸ“š/g, to: '📚' },
    { from: /ðŸ  /g, to: '🏠' },
    { from: /ðŸ’Š/g, to: '💊' },
    { from: /ðŸ ¥/g, to: '🏥' },
    { from: /ðŸ©º/g, to: '🥼' },
    { from: /ðŸ©¸/g, to: '🩸' },
    { from: /â ¤ï¸ /g, to: '❤️' },
    { from: /ðŸ‘¶/g, to: '👶' },
    { from: /ðŸŒ /g, to: '🌐' },
    { from: /ðŸ“ /g, to: '📍' },
    { from: /ðŸ¤ /g, to: '🤝' }
];

kbFixes.forEach(fix => {
    content = content.replace(fix.from, fix.to);
});

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully applied Regex-based emoji restoration to script.js');
