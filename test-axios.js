const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testSubmit() {
    try {
        const formData = new FormData();
        formData.append('firstName', 'Jane');
        formData.append('lastName', 'Smith');
        formData.append('contactEmail', 'hdl.freelancing.business@gmail.com');
        formData.append('contactPhone', '201-555-0199');
        formData.append('position', 'Clinical Nursing Instructor');
        formData.append('startDate', 'Immediately');
        formData.append('AppMethod', 'manual');
        formData.append('SignatureData', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

        // Append actual image from assets 
        formData.append('applicantPhoto', fs.createReadStream('./asset/images/Felicia.jpg'), 'Felicia.jpg');

        const response = await axios.post('http://localhost:3000/apply-job', formData, {
            headers: formData.getHeaders()
        });

        console.log('Status:', response.status);
        console.log('Response:', response.data);
    } catch (err) {
        console.error('Error submitting form:', err.response ? err.response.data : err.message);
    }
}

testSubmit();
