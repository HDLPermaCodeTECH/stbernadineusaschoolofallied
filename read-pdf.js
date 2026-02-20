const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('test_app.pdf');

pdf(dataBuffer).then(function (data) {
    console.log("Number of pages: " + data.numpages);
    console.log("Text content: ");
    console.log(data.text);
}).catch(err => {
    console.error(err);
});
