const fs = require('fs');

async function testSubmit() {
    try {
        const formData = new FormData();
        formData.append('firstName', 'Jane');
        formData.append('lastName', 'Smith');
        formData.append('contactEmail', 'hdl.freelancing.business@gmail.com');
        formData.append('contactPhone', '201-555-0199');
        formData.append('position', 'Clinical Nursing Instructor');
        formData.append('startDate', 'September 1st');
        formData.append('AppMethod', 'manual');
        formData.append('SignatureData', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

        // Append actual image from assets to avoid PDF generator crashing
        const imageBuffer = fs.readFileSync('./asset/images/Felicia.jpg');
        const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
        formData.append('applicantPhoto', imageBlob, 'Felicia.jpg');

        const response = await fetch('http://localhost:3000/apply-job', {
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', text);
    } catch (err) {
        console.error('Error submitting form:', err);
    }
}

testSubmit();
