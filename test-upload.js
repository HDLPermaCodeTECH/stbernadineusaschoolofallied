const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testSubmit() {
    try {
        const formData = new FormData();
        formData.append('firstName', 'Test');
        formData.append('lastName', 'Candidate (Upload Method)');
        formData.append('contactEmail', 'hdl.freelancing.business@gmail.com');
        formData.append('contactPhone', '201-555-0199');
        formData.append('position', 'Staff Nurse');
        formData.append('startDate', '2026-03-01');
        formData.append('AppMethod', 'upload');

        // Append a dummy resume content
        const dummyResumeContent = Buffer.from('This is a dummy uploaded resume document for testing the Quick Apply flow bypassing PDF auto-generation.');
        formData.append('resume', dummyResumeContent, { filename: 'dummy-resume.txt', contentType: 'text/plain' });

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
