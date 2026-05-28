const fs = require('fs');
const path = require('path');

const files = [
  'about-us/index.html', 'agency-news.html', 'apply-job.html', 'apply.html', 'blog.html', 
  'career-advice.html', 'ch-hha-program.html', 'clinical-skills.html', 'cma-program.html', 
  'cna-program.html', 'contact.html', 'continuing-education.html', 'course-catalog.html', 
  'cpr-program.html', 'ekg-phlebotomy-program.html', 'forms.html', 'home-care-inquiry.html', 
  'home-care.html', 'index.html', 'inquiry.html', 'medical-assistant-program.html', 
  'medical-form.html', 'newborn-care-program.html', 'payment.html', 'pct-program.html', 
  'placement.html', 'privacy.html', 'promo-video.html', 'referral.html', 'request-care.html', 
  'school-of-allied-health-services/index.html', 'student-life.html', 'terms.html', 
  'tuition-schedule.html', 'tuition.html'
];

files.forEach(file => {
  try {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    const isSubdir = file.includes('/');
    const replacement = isSubdir ? '../index.html' : 'index.html';
    
    // Replace href="https://www.stbernadineusa.com/" with relative link
    const newContent = content.replace(/href="https:\/\/www\.stbernadineusa\.com\/"/g, `href="${replacement}"`);
    
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log('Updated ' + file);
    }
  } catch(e) {
    console.error('Error on ' + file, e);
  }
});
console.log('Done!');
