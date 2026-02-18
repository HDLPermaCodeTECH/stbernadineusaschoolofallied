const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// Serve static files
app.use(express.static(__dirname));

// Configure Brevo API
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.EMAIL_PASS;

// Helper: Generate PDF
const generatePDF = (data, signatureBuffer) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // --- Header ---
        const logoPath = path.join(__dirname, 'asset/images/4d-logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 80 });
        }

        doc.font('Helvetica-Bold').fontSize(18).text('ST. BERNADINE', 150, 50);
        doc.fontSize(12).text('SCHOOL OF ALLIED HEALTH', 150, 75);
        doc.font('Helvetica').fontSize(10).text('591 Summit Ave Suite 410, Jersey City, NJ 07306', 150, 95);
        doc.text('Phone: +1 (201) 222-1116 | Email: info@stbernadine.com', 150, 110);

        doc.moveDown(3);

        // --- Title ---
        doc.rect(50, 140, 495, 30).fill('#003366'); // Dark blue background
        doc.fillColor('white').font('Helvetica-Bold').fontSize(14).text('STUDENT ENROLLMENT APPLICATION', 50, 148, { align: 'center', width: 495 });

        doc.fillColor('black').moveDown(2);

        let y = 190;

        // --- Program Info ---
        if (data['Program']) {
            doc.font('Helvetica-Bold').fontSize(12).text(`Program Applied For: ${data['Program']}`, 50, y, { align: 'center' });
            y += 30;
        }

        // --- Application Details ---
        const addField = (label, value) => {
            doc.font('Helvetica-Bold').fontSize(11).text(label + ':', 50, y);
            doc.font('Helvetica').fontSize(11).text(value || 'N/A', 200, y);
            y += 20;
            if (y > 750) {
                doc.addPage();
                y = 50;
            }
        };

        addField('Full Name', `${data.firstName} ${data.middleName || ''} ${data.lastName}`);
        addField('Address', `${data.address}`);
        addField('City, State, Zip', `${data.city}, ${data.state} ${data.postalCode}`);
        addField('Country', data.country);
        addField('Phone', data.phone);
        addField('Email', data.email);

        y += 10;
        doc.moveTo(50, y).lineTo(545, y).stroke(); // Separator
        y += 15;

        addField('Mother\'s Maiden Name', data.motherName);
        addField('Father\'s Name', data.fatherName);
        addField('Emergency Contact', data.emergencyContactName);
        addField('Emergency Phone', data.emergencyContactPhone);
        addField('Referred By', data.referrer);

        y += 10;
        doc.moveTo(50, y).lineTo(545, y).stroke(); // Separator
        y += 15;

        addField('Profession', data.profession === 'Other' ? data.otherProfession : data.profession);
        addField('School', data.school);
        addField('Course', data.course);
        addField('Year Graduated', data.yearGraduated);

        // Employment History
        if (data.company1) {
            y += 15;
            doc.font('Helvetica-Bold').text('Employment History:', 50, y);
            y += 20;
            addField('1. Company', `${data.company1} (${data.dateEmployed1})`);
        }
        if (data.company2) {
            y += 5;
            addField('2. Company', `${data.company2} (${data.dateEmployed2})`);
        }

        doc.moveDown(2);

        // --- Signature ---
        y = doc.y + 20;
        if (y > 700) doc.addPage();

        doc.font('Helvetica-Bold').text('Declaration:', 50, y);
        doc.font('Helvetica').fontSize(10).text(
            'I certify that my answers are true and complete to the best of my knowledge.',
            50, y + 15, { width: 495 }
        );

        y += 50;
        if (signatureBuffer) {
            doc.text('Applicant Signature:', 50, y);
            doc.image(signatureBuffer, 50, y + 15, { height: 60 });
        } else {
            doc.text('(Signed Digitally)', 50, y + 20);
        }

        doc.text(`Date of Application: ${data.dateOfApplication}`, 350, y + 40);

        doc.end();
    });
};

// ... (blank PDF generation remains same as it generates a static blank form) ...

// ...

// Route to handle form submission
app.post('/send-email', upload.array('attachment'), async (req, res) => {
    try {
        console.log("Received form submission:", req.body);

        const data = req.body;
        // ... (rest of processing)

        // Wrapper to fix legacy keys if necessary (optional, but good for backward compat if cached)
        // We can just rely on the new HTML being served.

        // ...

        // Format Email Content
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px;">New Student Application Received</h2>
                <p style="font-size: 16px;">A new application has been submitted. The official PDF is attached.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                    <h3 style="margin-top: 0; color: #333;">Applicant Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px; font-weight: bold; width: 150px;">Program:</td>
                            <td style="padding: 8px; color: #003366; font-weight: bold;">${data.Program || 'Not Specified'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold;">Name:</td>
                            <td style="padding: 8px;">${data.firstName} ${data.lastName || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold;">Email:</td>
                            <td style="padding: 8px;">${data.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold;">Phone:</td>
                            <td style="padding: 8px;">${data.phone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold;">Emergency Contact:</td>
                            <td style="padding: 8px;">${data.emergencyContactName} (${data.emergencyContactPhone})</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold;">Education Course:</td>
                            <td style="padding: 8px;">${data.course || 'N/A'}</td>
                        </tr>
                    </table>
                </div>

                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                    <em>This email was generated automatically by the St. Bernadine application system (via Brevo API).</em>
                </p>
            </div>
        `;

        // Send Email via API
        await sendEmail(process.env.EMAIL_USER, `New Application: ${data.firstName || 'Applicant'}`, htmlContent, attachments);

        res.status(200).send('Application Submitted Successfully!');

    } catch (error) {
        console.error("Error processing application:", error);
        res.status(500).send('Error processing application: ' + error.message);
    }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
    console.log('Created uploads directory');
}

// Health Check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Version Check (Debug)
app.get('/version', (req, res) => {
    res.status(200).send('BREVO_API_V2');
});

// Start Server
console.log('Attempting to start server...');
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Using Brevo API for emails (VERSION: BREVO_API_V2)`);
    console.log(`To view your site, open your browser to: http://0.0.0.0:${PORT}/apply.html`);
});
