const fs = require('fs');
const path = require('path');

const targetFile = 'c:/Users/hdlfr/OneDrive/Documents/St. Bernadine Official Website/asset/script.js';
let content = fs.readFileSync(targetFile, 'utf8');

const mapping = {
    'ðŸ“  Apply Now': '📝 Apply Now',
    'ðŸ ¥ Request Care': '🏥 Request Care',
    'ðŸ“š Programs': '📚 Programs',
    'ðŸ’° Tuition': '💰 Tuition',
    'ðŸŽ“ Student Life': '🎓 Student Life',
    'ðŸŒ  Visa Sponsorship': '🌐 Visa Sponsorship',
    'ðŸ‘©â€ âš•ï¸  Founder': '👩‍⚕️ Founder',
    'ðŸ“  Location': '📍 Location',
    'ðŸ¤  Referral': '🤝 Referral',
    'ðŸ“š': '📚',
    'ðŸ  ': '🏠',
    'ðŸ’Š': '💊',
    'ðŸ ¥': '🏥',
    'ðŸ©º': '🥼',
    'ðŸ©¸': '🩸',
    'â ¤ï¸ ': '❤️',
    'ðŸ‘¶': '👶',
    'ðŸ§ ðŸ’¨': '🧠💨',
    'ðŸ ª': '🍪',
    'dY\"?': '📝',
    'dY\"': '📝',
    'dY': '📝' // Dangerous, but let's see context
};

// More specific replacements for the topics array to avoid false positives
const topicsPattern = /\{ label: '.*?', query: '.*?' \}/g;
content = content.replace(topicsPattern, (match) => {
    let replaced = match;
    for (const [key, value] of Object.entries(mapping)) {
        replaced = replaced.split(key).join(value);
    }
    return replaced;
});

// Replace in knowledge base
const kbPattern = /response: \".*?\"/g;
content = content.replace(kbPattern, (match) => {
    let replaced = match;
    for (const [key, value] of Object.entries(mapping)) {
        replaced = replaced.split(key).join(value);
    }
    return replaced;
});

// Final cleanup for standalone corruptions
for (const [key, value] of Object.entries(mapping)) {
    if (key.length > 2) { // Only do long strings to avoid over-replacement
        content = content.split(key).join(value);
    }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully applied encoding fixes to script.js');
