
const fs = require('fs');
const path = require('path');

const directoryPath = 'c:\\Users\\hdlfr\\OneDrive\\문서\\St. Bernadine Official Website';
const oldEmail = 'school@stbernadineschoolofallied.com';
const newEmail = 'school@stbernadineschoolofallied.com';

// Recursive function to walk through directories
function walk(dir, callback) {
    fs.readdir(dir, function (err, files) {
        if (err) throw err;
        files.forEach(function (file) {
            const filepath = path.join(dir, file);
            fs.stat(filepath, function (err, stats) {
                if (stats.isDirectory()) {
                    if (file !== '.git' && file !== 'node_modules' && file !== 'uploads') {
                        walk(filepath, callback);
                    }
                } else if (stats.isFile()) {
                    // Filter for specific file extensions
                    if (['.html', '.js', '.css', '.json', '.md'].includes(path.extname(file))) {
                        callback(filepath);
                    }
                }
            });
        });
    });
}

walk(directoryPath, function (filepath) {
    fs.readFile(filepath, 'utf8', function (err, data) {
        if (err) return console.log(err);

        // Check if file contains the old email
        if (data.indexOf(oldEmail) !== -1) {
            // Replace globally
            const regex = new RegExp(oldEmail, 'g');
            const result = data.replace(regex, newEmail);
            fs.writeFile(filepath, result, 'utf8', function (err) {
                if (err) return console.log(err);
                console.log(`Updated: ${filepath}`);
            });
        }
    });
});
