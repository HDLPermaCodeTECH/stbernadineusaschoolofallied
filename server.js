const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Make sure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// Serve static files
app.use(express.static(__dirname));

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
        doc.font('Helvetica').fontSize(10).text('591 Summit Ave Suite 415, Jersey City, NJ 07306', 150, 95);
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

        addField('Full Name', `${data['First Name']} ${data['Middle Name'] || ''} ${data['Last Name']}`);
        addField('Address', `${data['Address']}`);
        addField('City, State, Zip', `${data['City']}, ${data['State']} ${data['Postal Code']}`);
        addField('Country', data['Country']);
        addField('Phone', data['Phone']);
        addField('Email', data['email']);

        y += 10;
        doc.moveTo(50, y).lineTo(545, y).stroke(); // Separator
        y += 15;

        addField('Mother\'s Maiden Name', data['Mother Name']);
        addField('Father\'s Name', data['Father Name']);
        addField('Emergency Contact', data['Emergency Contact Name']);
        addField('Emergency Phone', data['Emergency Contact Phone']);
        addField('Referred By', data['Referrer']);

        y += 10;
        doc.moveTo(50, y).lineTo(545, y).stroke(); // Separator
        y += 15;

        addField('Profession', data['profession'] === 'Other' ? data['Other Profession'] : data['profession']);
        addField('School', data['School']);
        addField('Course', data['Course']);
        addField('Year Graduated', data['Year Graduated']);

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

        doc.text(`Date of Application: ${data['Date of Application']}`, 350, y + 40);

        doc.end();
    });
};


// Helper: Generate Blank PDF
const generateBlankPDF = () => {
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
        doc.font('Helvetica').fontSize(10).text('591 Summit Ave Suite 415, Jersey City, NJ 07306', 150, 95);
        doc.text('Phone: +1 (201) 222-1116 | Email: info@stbernadine.com', 150, 110);

        doc.moveDown(3);

        // --- Title ---
        doc.rect(50, 140, 495, 30).fill('#003366');
        doc.fillColor('white').font('Helvetica-Bold').fontSize(14).text('STUDENT ENROLLMENT APPLICATION', 50, 148, { align: 'center', width: 495 });

        doc.fillColor('black').moveDown(2);

        let y = 190;

        // --- Program Info ---
        doc.font('Helvetica-Bold').fontSize(12).text('Program Applied For (Check One):', 50, y);
        y += 25;

        const programs = [
            'Certified Nurse Aide (CNA)', 'Certified Homemaker Home Health Aide (CH-HHA)',
            'Certified Medication Aide (CMA)', 'Patient Care Technician (PCT)',
            'Certified Medical Assistant', 'EKG/Phlebotomy Program',
            'CPR and Basic Life Support (BLS)', 'Certified Newborn Care Specialist'
        ];

        doc.font('Helvetica').fontSize(10);
        let x = 50;
        programs.forEach((prog, index) => {
            doc.rect(x, y, 12, 12).stroke();
            doc.text(prog, x + 18, y + 2);
            if (index % 2 === 1) {
                y += 20;
                x = 50;
            } else {
                x = 300;
            }
        });
        y += 20;

        // --- Application Details ---
        const addBlankField = (label, yPos) => {
            doc.font('Helvetica-Bold').fontSize(11).text(label + ':', 50, yPos);
            doc.moveTo(200, yPos + 10).lineTo(545, yPos + 10).stroke(); // Underline
            return yPos + 30;
        };

        y = addBlankField('Full Name', y);
        y = addBlankField('Address', y);
        y = addBlankField('City, State, Zip', y);
        y = addBlankField('Country', y);
        y = addBlankField('Phone', y);
        y = addBlankField('Email', y);

        y += 10;
        doc.moveTo(50, y).lineTo(545, y).lineWidth(2).stroke().lineWidth(1); // Separator
        y += 20;

        y = addBlankField('Mother\'s Maiden Name', y);
        y = addBlankField('Father\'s Name', y);
        y = addBlankField('Emergency Contact', y);
        y = addBlankField('Emergency Contact #', y);
        y = addBlankField('Referred By', y);

        y += 10;
        doc.moveTo(50, y).lineTo(545, y).lineWidth(2).stroke().lineWidth(1); // Separator
        y += 20;

        if (y > 700) { doc.addPage(); y = 50; }

        doc.font('Helvetica-Bold').text('Profession:', 50, y);
        y += 20;
        const professions = ['Registered Nurse', 'NCLEX-RN', 'Occupational Therapist', 'Physical Therapist', 'Caregiver', 'Other'];
        x = 50;
        professions.forEach((prof, i) => {
            doc.rect(x, y, 12, 12).stroke();
            doc.font('Helvetica').text(prof, x + 18, y + 2);
            x += 160;
            if ((i + 1) % 3 === 0) { x = 50; y += 20; }
        });

        y += 20;
        y = addBlankField('School', y);
        y = addBlankField('Course', y);
        y = addBlankField('Year Graduated', y);

        y += 10;
        doc.font('Helvetica-Bold').text('Employment History:', 50, y);
        y += 20;

        doc.font('Helvetica').fontSize(10);
        doc.text('1. Company:', 50, y);
        doc.moveTo(120, y + 10).lineTo(300, y + 10).stroke();
        doc.text('Dates:', 320, y);
        doc.moveTo(360, y + 10).lineTo(545, y + 10).stroke();
        y += 25;

        doc.text('2. Company:', 50, y);
        doc.moveTo(120, y + 10).lineTo(300, y + 10).stroke();
        doc.text('Dates:', 320, y);
        doc.moveTo(360, y + 10).lineTo(545, y + 10).stroke();
        y += 25;

        if (y > 700) { doc.addPage(); y = 50; }

        doc.moveDown(2);
        y = doc.y + 20;

        doc.font('Helvetica-Bold').fontSize(11).text('Declaration:', 50, y);
        doc.font('Helvetica').fontSize(10).text(
            'I certify that my answers are true and complete to the best of my knowledge.',
            50, y + 15, { width: 495 }
        );

        y += 60;
        doc.moveTo(50, y).lineTo(300, y).stroke();
        doc.text('Applicant Signature', 50, y + 5);

        doc.moveTo(350, y).lineTo(545, y).stroke();
        doc.text('Date', 350, y + 5);

        doc.end();
    });
};

// Route to download blank application form
app.get('/api/download-form', async (req, res) => {
    console.log('PDF download requested.');
    try {
        const pdfBuffer = await generateBlankPDF();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="St_Bernadine_Application_Form.pdf"',
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Error generating blank PDF:", error);
        res.status(500).send("Error generating PDF");
    }
});

// Route to handle form submission with file upload
app.post('/send-email', upload.array('attachment'), async (req, res) => {
    try {
        console.log("Received form submission:", req.body);
        console.log("Received files:", req.files);

        const data = req.body;
        const files = req.files;

        // Process Signature
        let signatureBuffer = null;
        if (data.signature_image && data.signature_image.startsWith('data:image')) {
            const signatureParts = data.signature_image.split(',');
            const signatureBase64 = signatureParts[1];
            signatureBuffer = Buffer.from(signatureBase64, 'base64');
            delete data.signature_image; // Remove from JSON data to keep it clean
        }

        // Generate PDF
        console.log("Generating PDF...");
        const pdfBuffer = await generatePDF(data, signatureBuffer);
        console.log("PDF generated successfully.");

        // Configure Nodemailer
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Prepare attachments
        let attachments = [
            {
                filename: 'Application_Form.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ];

        // Add uploaded files to attachments
        if (files && files.length > 0) {
            files.forEach(file => {
                attachments.push({
                    filename: file.originalname,
                    path: file.path
                });
            });
        }

        // Format Email Content
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: `New Application: ${data['First Name'] || 'Applicant'}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px;">New Student Application Received</h2>
                    <p style="font-size: 16px;">A new application has been submitted. The official PDF is attached.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                        <h3 style="margin-top: 0; color: #333;">Applicant Summary</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; font-weight: bold; width: 150px;">Program:</td>
                                <td style="padding: 8px; color: #003366; font-weight: bold;">${data['Program'] || 'Not Specified'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold;">Name:</td>
                                <td style="padding: 8px;">${data['First Name']} ${data['Last Name'] || ''}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold;">Email:</td>
                                <td style="padding: 8px;">${data['email']}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold;">Phone:</td>
                                <td style="padding: 8px;">${data['Phone']}</td>
                            </tr>
                             <tr>
                                <td style="padding: 8px; font-weight: bold;">Education Course:</td>
                                <td style="padding: 8px;">${data['Course'] || 'N/A'}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="margin-top: 20px; font-size: 14px; color: #666;">
                        <em>This email was generated automatically by the St. Bernadine application system.</em>
                    </p>
                </div>
            `,
            attachments: attachments
        };

        // Send Email
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);

        // Respond
        res.status(200).send('Application Submitted Successfully! PDF Generated.');

    } catch (error) {
        console.error("Error processing application:", error);
        res.status(500).send('Error processing application: ' + error.message);
    }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`To view your site, open your browser to: http://localhost:${PORT}/apply.html`);
});
