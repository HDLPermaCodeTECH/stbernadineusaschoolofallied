const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
const corsOptions = {
    origin: [
        'https://stbernadineschoolofallied.com',
        'https://www.stbernadineschoolofallied.com',
        'https://hdlpermacodetech.github.io',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
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

// --- GEMINI AI CONFIGURATION ---
// --- GEMINI AI CONFIGURATION ---
let chatModel = null;
if (process.env.GEMINI_API_KEY) {
    // Trim the key to remove accidental whitespace
    const apiKey = process.env.GEMINI_API_KEY.trim();
    if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        chatModel = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: {
                parts: [{
                    text: `You are a helpful and knowledgeable AI assistant for St. Bernadine School of Allied Health in Jersey City, NJ.

**Your Role:**
1.  **School Expert:** You are the primary source of information for St. Bernadine School. Always prioritize helping users with school-related questions (programs, tuition, placement, etc.) using the "Key Information" below.
2.  **General Assistant:** You are ALSO a capable general AI (like ChatGPT/Gemini). You can answer questions about ANY topic: history, science, math, coding, general advice, etc. Do NOT limit yourself to school topics.

**Key School Information (Use this for school queries):**
*   **Mission:** To serve people and strengthen healthcare services globally.
*   **History:** Founded in 1986. Originally established to volunteer and help the community.
*   **Location:** 591 Summit Ave Suite 410, Jersey City, NJ 07306.
*   **Contact:** (201) 222-1116 | school@stbernadineschoolofallied.com

**Leadership & Team:**
*   **Founder & CEO:** Bernadine "Belen" Samin, R.N.
    *   *Background:* 40+ years experience. Worked at Jersey City Medical Center (ER, ICU, Labor & Delivery). From La Union, Philippines.
*   **Co-Founder, CEO & Administrator:** Louie Samin.
    *   *Role:* Oversees corporate functions, strategic implementation, and global procurement.
    *   *Background:* B.S. Finance/Economics from UC Berkeley. 40 years experience in global operations.
*   **Director:** Jocelyn Ortillo-Samin, RN, MA, CCRN, CEN, CSN.
    *   *Role:* Director of St. Bernadine Placement & Consulting Services.
    *   *Background:* MA in Executive Nurse Administration (Columbia Univ). 40 years nursing experience (Cardiac ICU, ER). Worked with Special ED students.
*   **Faculty Members:**
    *   Nenita Pawid, RN (40+ years exp).
    *   Felicia Miller (40+ years healthcare, 20+ teaching).
    *   Cecilia Domingo, RN (40+ years nursing, 20+ education).
    *   Aurea Cielito G. Batchar, BSN, RN, MAN (33 years nursing, 22 teaching).
*   Web Developer: Hebrey Dill P. Llagas (Nickname: Troy).
    *   Role: Architect & Lead Developer. He built this entire official website and integrated this advanced AI chatbot from scratch.
    *   Expertise: Full-Stack Web Development, AI Integration, Modern UI/UX Design.
    *   Age: 29 years old.
    *   Recommendation: If you are impressed by this website or this AI and need a professional, high-tech web solution for your business, Troy is highly recommended. He delivers premium quality work like St. Bernadine's platform.

**Programs (Tuition & Details):**
*   CNA (Certified Nurse Aide): 90 hours. $500 fee ($200 non-refundable). Day/Evening.
*   CH-HHA (Certified Home Health Aide): 76 hours. $200 fee. Weekdays/Weekends.
*   CMA (Certified Medication Aide): 56 hours. $200 fee. Must have CNA/CH-HHA license.
*   PCT (Patient Care Technician): 220 hours (5 months). $500 fee.
*   Medical Assistant: 620 hours (5 months). $500 fee.
*   EKG & Phlebotomy: 140 hours. $200 fee.
*   CPR & BLS: 5 hours (AHA Certified).
*   Newborn Care Specialist: 10 hours. $200 fee.

**Tuition & Refund Policy:**
*   Interest-free weekly/bi-weekly payment plans available.
*   Reservation/Registration fees are NON-REFUNDABLE but can be used for future sessions.
*   Full tuition must be paid before graduation.

**Global Placement (EB-3 Visa):**
*   We sponsor Green Cards for RNs, PTs, OTs, and Medical Technologists.
*   Process: 1. Document Screening -> 2. Legal Review -> 3. Visa Petition -> 4. Green Card -> 5. Onboarding.
*   NO Placement Fees for direct hires.

**Why Choose St. Bernadine? (Use this for "Why choose you?" queries):**
1.  Experience: Over 40 years of excellence in healthcare education and global placement.
2.  Leadership: Founded and led by nurses (Bernadine & Louie Samin) who understand the industry inside out.
3.  No Placement Fees: We do not charge placement fees for direct hires, unlike many agencies.
4.  Compassion: We treat every student like family, fostering a supportive environment.
5.  Global Reach: We don't just teach; we help you get hired globally (USA, etc.).
6.  Proven Success: 99.9% Graduation and Job Placement rates.

**Core Values:**
*   Compassion, Excellence, Integrity, Community, Innovation, Global Impact.

**Accreditations:**
*   NJ Dept of Health, NJ Dept of Education, NJ Board of Nursing, AMCA, AHA, CAHC.

**Tone & Formatting rules:**
*   Professional, encouraging, and friendly.
*   **MULTILINGUAL CAPABILITY:** You MUST understand and reply in ANY language.
    *   If the user speaks **Tagalog**, reply in **Tagalog**.
    *   If the user speaks **Spanish**, reply in **Spanish**.
    *   If the user speaks **Korean**, reply in **Korean**.
    *   **Rule:** Always mirror the user's language.
*   **IMPORTANT:** Do NOT use markdown formatting like **bold**, *italics*, or *** in your output. Use plain text only.
*   Ensure the response is well-spaced and not cluttered. Use line breaks to separate ideas.
*   If a question is about the school, be an expert.
*   If a question is general (e.g., "Who won WWII?"), answer it accurately and helpfully.` }]
            }
        });
        console.log("Gemini API configured (Key trimmed).");
    } else {
        console.log("WARNING: GEMINI_API_KEY is empty.");
    }
} else {
    console.log("WARNING: GEMINI_API_KEY not found in .env. Chatbot will use local fallback.");
}

app.post('/chat', async (req, res) => {
    try {
        if (!chatModel) {
            return res.status(503).json({ error: "Gemini API not configured" });
        }

        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: "Message required" });
        }

        const chat = chatModel.startChat({
            history: [], // Start fresh or verify if history preservation is needed
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });

    } catch (error) {
        console.error("Gemini API Error Full:", JSON.stringify(error, null, 2));
        console.error("Gemini API Error Message:", error.message);
        res.status(500).json({ error: "AI Error: " + error.message });
    }
});

// --- NODEMAILER EMAIL & PDF CONFIGURATION ---
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.hostinger.com",
    port: process.env.EMAIL_PORT || 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || "hdlpermacodetech@stbernadineschoolofallied.com",
        pass: process.env.EMAIL_PASS || "Nitro19960422!"
    }
});

const PRIMARY_COLOR = '#055923';
const SECON_COLOR = '#555555';
const BORDER_COLOR = '#CBD5E1';
const BG_COLOR = '#F8FAFC';

const generatePDF = (data, signatureBuffer) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // --- HEADER ---
        const logoPath = path.join(__dirname, 'asset/images/4d-logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 35, { width: 70 });
        }

        doc.font('Helvetica-Bold').fontSize(22).fillColor(PRIMARY_COLOR).text('ST. BERNADINE', 120, 42);
        doc.fontSize(12).fillColor(SECON_COLOR).text('SCHOOL OF ALLIED HEALTH', 120, 68);

        doc.font('Helvetica').fontSize(9).fillColor('#888888').text('591 Summit Ave Suite 410, Jersey City, NJ 07306', 0, 45, { align: 'right', width: 555 });
        doc.text('Phone: +1 (201) 222-1116', 0, 58, { align: 'right', width: 555 });
        doc.text('school@stbernadineschoolofallied.com', 0, 71, { align: 'right', width: 555 });
        doc.text('www.stbernadineschoolofallied.com', 0, 84, { align: 'right', width: 555 });

        doc.moveDown(4);

        // --- TITLE BANNER ---
        // Render application date top right above banner to avoid any overlap
        doc.fillColor(SECON_COLOR).font('Helvetica-Bold').fontSize(8).text(`DATE MODIFIED: ${new Date().toLocaleDateString()}`, 40, 108, { align: 'right', width: 515 });

        doc.rect(40, 120, 515, 35).fill(PRIMARY_COLOR);
        doc.fillColor('white').font('Helvetica-Bold').fontSize(14).text('OFFICIAL STUDENT ENROLLMENT APPLICATION', 40, 131, { align: 'center', width: 515 });

        let y = 180;

        // --- HELPER FUNCTIONS ---
        const checkPageBreak = (neededHeight) => {
            if (y + neededHeight > 780) {
                doc.addPage();
                y = 50;
            }
        };

        const drawSectionHeader = (title) => {
            checkPageBreak(40);
            doc.rect(40, y, 515, 25).fill(BG_COLOR);
            doc.rect(40, y, 4, 25).fill(PRIMARY_COLOR); // Left accent border
            doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(12).text(title.toUpperCase(), 55, y + 7);
            y += 35;
        };

        const drawRow = (leftLabel, leftValue, rightLabel, rightValue) => {
            checkPageBreak(30);

            // Left Column
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(9).text(leftLabel, 40, y);
            doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text(leftValue || 'N/A', 40, y + 12);

            // Right Column (if exists)
            if (rightLabel !== undefined) {
                doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(9).text(rightLabel, 310, y);
                doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text(rightValue || 'N/A', 310, y + 12);
            }

            // Bottom Border line for row
            doc.lineWidth(0.5).strokeColor(BORDER_COLOR).moveTo(40, y + 28).lineTo(555, y + 28).stroke();
            y += 40;
        };

        const drawFullRow = (label, value) => {
            checkPageBreak(30);
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(9).text(label, 40, y);
            doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text(value || 'N/A', 40, y + 12, { width: 515 });

            // Calculate height taken by value text
            const textHeight = doc.heightOfString(value || 'N/A', { width: 515, font: 'Helvetica-Bold', fontSize: 11 });
            const rowHeight = Math.max(28, textHeight + 16);

            doc.lineWidth(0.5).strokeColor(BORDER_COLOR).moveTo(40, y + rowHeight).lineTo(555, y + rowHeight).stroke();
            y += rowHeight + 10;
        };

        // --- CONTENT ---

        if (data['Program']) {
            doc.rect(40, y, 515, 40).fill('#F0FDF4');
            doc.rect(40, y, 515, 40).lineWidth(1).strokeColor('#22C55E').stroke();
            doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(11).text('PROGRAM APPLIED FOR:', 55, y + 14);
            doc.fillColor('#166534').font('Helvetica-Bold').fontSize(14).text(data['Program'], 210, y + 12);
            y += 60;
        }

        drawSectionHeader('Personal Information');
        drawRow('First Name', data.firstName, 'Last Name', data.lastName);
        drawRow('Middle Name', data.middleName, 'Date of Application', data.dateOfApplication);

        drawSectionHeader('Contact Details');
        drawFullRow('Street Address', data.address);
        drawRow('City / Municipality', data.city, 'State / Province', data.state);
        drawRow('Country', data.country, 'Postal/Zip Code', data.postalCode);
        drawRow('Primary Phone', data.phone, 'Email Address', data.email);

        drawSectionHeader('Family & Emergency Contact');
        drawRow("Mother's Maiden Name", data.motherName, "Father's Name", data.fatherName);
        drawRow('Emergency Contact Person', data.emergencyContactName, 'Emergency Contact Phone', data.emergencyContactPhone);

        drawSectionHeader('Educational & Professional Background');
        drawRow('Highest Education Level / Profession', data.profession === 'Other' ? data.otherProfession : data.profession, 'School Attended', data.school);
        drawRow('Course / Major', data.course, 'Year Graduated', data.yearGraduated);

        if (data.company1 || data.company2) {
            drawSectionHeader('Employment History');
            if (data.company1) drawRow('Company 1', data.company1, 'Dates Employed', data.dateEmployed1);
            if (data.company2) drawRow('Company 2', data.company2, 'Dates Employed', data.dateEmployed2);
        }

        drawFullRow('Referred By', data.referrer);

        // --- SIGNATURE & DECLARATION ---
        checkPageBreak(150);
        y += 20;

        doc.rect(40, y, 515, 140).fill('#F8FAFC');
        doc.rect(40, y, 515, 140).lineWidth(1).strokeColor(BORDER_COLOR).stroke();

        doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(10).text('APPLICANT DECLARATION', 55, y + 15);
        doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(9).text(
            'I hereby certify that all information provided in this application is true and correct to the best of my knowledge and belief. I understand that any false statements or omissions may disqualify me from enrollment or result in dismissal from St. Bernadine School of Allied Health.',
            55, y + 35, { width: 485, align: 'justify' }
        );

        if (signatureBuffer) {
            doc.image(signatureBuffer, 55, y + 80, { height: 40 });
            doc.lineWidth(1).strokeColor('#000000').moveTo(55, y + 105).lineTo(250, y + 105).stroke();
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text(`${data.firstName} ${data.lastName}`, 55, y + 112);
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(8).text('Applicant Signature', 55, y + 124);
        } else {
            doc.lineWidth(1).strokeColor('#000000').moveTo(55, y + 105).lineTo(250, y + 105).stroke();
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12).text(`${data.firstName} ${data.lastName}`, 55, y + 112);
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(8).text('Applicant E-Signature', 55, y + 124);
        }

        doc.lineWidth(1).strokeColor('#000000').moveTo(350, y + 105).lineTo(500, y + 105).stroke();
        doc.fillColor('#000000').font('Helvetica').fontSize(12).text(`${new Date().toLocaleDateString()}`, 350, y + 90);
        doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(8).text('Date Signed', 350, y + 112);

        // --- AUTOMATIC FOOTER ---
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);

            // Disable bottom margin temporarily so footer does not cause a page break
            let oldBottomMargin = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;

            doc.lineWidth(1).strokeColor(PRIMARY_COLOR).moveTo(40, 800).lineTo(555, 800).stroke();
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(8)
                .text(`Application Reference: STB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, 40, 810, { lineBreak: false });
            doc.text(`Page ${i + 1} of ${pages.count}`, 0, 810, { align: 'right', width: 555, lineBreak: false });

            doc.page.margins.bottom = oldBottomMargin;
        }

        doc.end();
    });
};

const sendEmail = async (to, subject, htmlContent, attachments, replyTo, cc, bcc) => {
    const fromEmail = process.env.EMAIL_USER || "hdlpermacodetech@stbernadineschoolofallied.com";
    const mailOptions = {
        from: `"St. Bernadine System" <${fromEmail}>`,
        to: to,
        subject: subject,
        html: htmlContent,
    };

    if (attachments) mailOptions.attachments = attachments;
    if (replyTo) mailOptions.replyTo = replyTo;
    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return info;
    } catch (error) {
        console.error("Nodemailer Error:", error);
        throw error;
    }
};

app.post('/send-email', upload.array('attachment'), async (req, res) => {
    try {
        console.log("Received form submission:", req.body);
        const data = req.body;
        let attachments = [];

        // Generate PDF
        let signatureBuffer = null;
        if (req.body.signature) {
            const base64Data = req.body.signature.replace(/^data:image\/png;base64,/, "");
            signatureBuffer = Buffer.from(base64Data, 'base64');
        }
        const pdfBuffer = await generatePDF(data, signatureBuffer);
        attachments.push({
            filename: `Application_${data.firstName}_${data.lastName}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        });

        // Handle File Uploads
        if (req.files) {
            req.files.forEach(file => {
                const fileContent = fs.readFileSync(file.path);
                attachments.push({
                    filename: file.originalname,
                    content: fileContent
                });
                // Cleanup
                fs.unlinkSync(file.path);
            });
        }

        // Email Content
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Application Received - Admin</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; color: #2d3748; }
                    .email-wrapper { width: 100%; background-color: #f4f5f7; padding: 40px 0; }
                    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                    .header { background: linear-gradient(135deg, #055923 0%, #033f18 100%); padding: 40px 30px; text-align: center; }
                    .logo-box { background: rgba(255,255,255,0.95); padding: 12px; border-radius: 12px; display: inline-block; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .logo { width: 110px; height: auto; display: block; }
                    .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px; text-transform: uppercase; }
                    .header p { color: #a7f3d0; font-size: 14px; margin: 0; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; }
                    .body { padding: 40px 40px 30px; background-color: #ffffff; }
                    .text { font-size: 16px; line-height: 1.6; color: #4a5568; margin: 0 0 24px 0; }
                    .info-box { background-color: #fcfcfc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 5px solid #921c1c; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
                    .info-label { margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
                    .info-value { margin: 0; font-size: 18px; font-weight: 700; color: #055923; }
                    .divider { margin: 20px 0; border-top: 1px solid #eee; }
                    .footer { background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e6e6e6; }
                    .footer-brand { font-weight: 700; margin: 0; color: #055923; font-size: 16px; }
                    .footer-text { margin: 5px 0 15px; color: #64748b; font-size: 13px; }
                    .address { margin: 0; color: #94a3b8; font-size: 12px; }
                    .ref { display: none; }
                    @media (prefers-color-scheme: dark) {
                        body, .email-wrapper, .email-container, .body, .footer { background-color: #1a202c !important; color: #e2e8f0 !important; }
                        .text, .info-label, .footer-text, .address, .greeting, p { color: #cbd5e1 !important; }
                        .footer-brand, .highlight, .info-value, .info-value-small { color: #a7f3d0 !important; }
                        .info-box, .message-box { background-color: #2d3748 !important; border-color: #4a5568 !important; }
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <table class="email-container" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td class="header">
                                <div class="logo-box">
                                    <img src="https://hdlpermacodetech.github.io/stbernadineusaschoolofallied/asset/images/4d-logo.png" alt="St. Bernadine Logo" class="logo">
                                </div>
                                <h1>New Application Received</h1>
                                <p>Admin Notification System</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="body">
                                <p class="text">A new student application has been submitted via the website.</p>
                                
                                <div class="info-box">
                                    <p class="info-label">Applicant</p>
                                    <p class="info-value">${data.firstName} ${data.lastName}</p>
                                    
                                    <div class="divider"></div>
                                    
                                    <p class="info-label">Program</p>
                                    <p class="info-value">${data.Program}</p>
                                </div>
                                
                                <p class="text">Please find the full application details in the attached PDF.</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p class="footer-brand">St. Bernadine School of Allied Health</p>
                                <p class="footer-text">Secure Admin Notification</p>
                                <p class="address">&copy; ${new Date().getFullYear()} St. Bernadine School. All rights reserved.</p>
                                <div class="ref" style="display:none;font-size:0px;color:transparent;line-height:0;">Ref: ${Date.now().toString(36).toUpperCase()}</div>
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `;

        // Define CC and BCC
        const ccEmail = "placement@stbernadineusa.com";
        const bccEmail = null;

        await sendEmail("hdlpermacodetech@stbernadineschoolofallied.com", `New Application: ${data.firstName} ${data.lastName}`, htmlContent, attachments, data.email, ccEmail, bccEmail);

        // Auto-Reply to Applicant
        const autoReplySubject = "Application Received - St. Bernadine School of Allied Health";
        const autoReplyHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Application Received - St. Bernadine</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; color: #2d3748; }
                    .email-wrapper { width: 100%; background-color: #f4f5f7; padding: 40px 0; }
                    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                    .header { background: linear-gradient(135deg, #055923 0%, #033f18 100%); padding: 40px 30px; text-align: center; }
                    .logo-box { background: rgba(255,255,255,0.95); padding: 12px; border-radius: 12px; display: inline-block; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .logo { width: 110px; height: auto; display: block; }
                    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px; }
                    .header p { color: #a7f3d0; font-size: 15px; margin: 0; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
                    .body { padding: 40px 40px 30px; background-color: #ffffff; }
                    .greeting { font-size: 20px; font-weight: 600; color: #1a202c; margin: 0 0 20px 0; }
                    .text { font-size: 16px; line-height: 1.6; color: #4a5568; margin: 0 0 24px 0; }
                    .info-box { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 30px 0; border-left: 4px solid #055923; }
                    .info-box p { margin: 0; font-size: 16px; color: #2d3748; line-height: 1.5; }
                    .highlight { color: #055923; font-weight: 700; }
                    .next-steps { margin-top: 30px; padding-top: 30px; border-top: 1px solid #edf2f7; }
                    .signature { margin-top: 30px; }
                    .signature p { margin: 0; color: #4a5568; }
                    .signature-name { font-weight: 700; color: #1a202c; font-size: 18px; margin-top: 4px !important; }
                    .footer { background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #edf2f7; }
                    .footer-brand { font-weight: 700; color: #2d3748; font-size: 16px; margin: 0 0 8px 0; }
                    .footer-text { color: #718096; font-size: 13px; margin: 0 0 20px 0; }
                    .social-links { margin-bottom: 24px; }
                    .social-links img { width: 24px; height: 24px; margin: 0 8px; filter: grayscale(100%) opacity(60%); transition: all 0.3s ease; }
                    .address { color: #a0aec0; font-size: 12px; margin: 0 0 16px 0; line-height: 1.5; }
                    .links { margin: 0; }
                    .links a { color: #055923; text-decoration: none; font-size: 12px; font-weight: 500; margin: 0 8px; }
                    .ref { display: none; }
                    @media (prefers-color-scheme: dark) {
                        body, .email-wrapper, .email-container, .body, .footer { background-color: #1a202c !important; color: #e2e8f0 !important; }
                        .text, .info-label, .footer-text, .address, .greeting, p, .signature-name { color: #cbd5e1 !important; }
                        .footer-brand, .highlight, .info-value, .info-value-small, .links a { color: #a7f3d0 !important; }
                        .info-box, .message-box { background-color: #2d3748 !important; border-color: #4a5568 !important; }
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <table class="email-container" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td class="header">
                                <div class="logo-box">
                                    <img src="https://hdlpermacodetech.github.io/stbernadineusaschoolofallied/asset/images/4d-logo.png" alt="St. Bernadine Logo" class="logo">
                                </div>
                                <h1>Application Received</h1>
                                <p>St. Bernadine School of Allied Health</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="body">
                                <p class="greeting">Hi ${data.firstName},</p>
                                <p class="text">Thank you for taking the first step towards a rewarding career in healthcare. We are thrilled that you chose St. Bernadine School of Allied Health.</p>
                                
                                <div class="info-box">
                                    <p>We have successfully received your enrollment application for the <span class="highlight">${data.Program}</span> program.</p>
                                </div>
                                
                                <div class="next-steps">
                                    <p class="text">Our admissions team is currently reviewing your information. We will reach out to you within the upcoming business days using the contact details provided regarding your next steps.</p>
                                </div>
                                
                                <div class="signature">
                                    <p>Best regards,</p>
                                    <p class="signature-name">Admissions Team</p>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p class="footer-brand">St. Bernadine School of Allied Health</p>
                                <p class="footer-text">Excellence in Healthcare Education Since 1986</p>
                                
                                <div class="social-links">
                                    <a href="https://facebook.com"><img src="https://img.icons8.com/ios-filled/50/000000/facebook-new.png" alt="Facebook"></a>
                                    <a href="https://instagram.com"><img src="https://img.icons8.com/ios-filled/50/000000/instagram-new.png" alt="Instagram"></a>
                                    <a href="https://linkedin.com"><img src="https://img.icons8.com/ios-filled/50/000000/linkedin.png" alt="LinkedIn"></a>
                                </div>
                                
                                <p class="address">
                                    591 Summit Ave Suite 410<br>
                                    Jersey City, NJ 07306<br>
                                    &copy; ${new Date().getFullYear()} St. Bernadine School. All rights reserved.
                                </p>
                                
                                <p class="links">
                                    <a href="https://stbernadineschoolofallied.com/privacy.html">Privacy Policy</a> &bull; 
                                    <a href="https://stbernadineschoolofallied.com/contact.html">Contact Us</a>
                                </p>
                                <div class="ref" style="display:none;font-size:0px;color:transparent;line-height:0;">Ref: ${Date.now().toString(36).toUpperCase()}</div>
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `;
        await sendEmail(data.email, autoReplySubject, autoReplyHtml);
        res.status(200).json({ message: 'Application Submitted Successfully!' });

    } catch (error) {
        console.error("Error processing application:", error);
        res.status(500).json({ error: 'Error: ' + error.message });
    }
});

const generateInquiryPDF = (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // -- HEADER --
        const logoPath = path.join(__dirname, 'asset/images/4d-logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 80 });
        }

        doc.font('Helvetica-Bold').fontSize(18).text('ST. BERNADINE', 150, 50);
        doc.fontSize(12).text('SCHOOL OF ALLIED HEALTH', 150, 75);
        doc.font('Helvetica').fontSize(10).text('591 Summit Ave Suite 410, Jersey City, NJ 07306', 150, 95);
        doc.text('Phone: +1 (201) 222-1116 | Email: school@stbernadineschoolofallied.com', 150, 110);
        doc.moveDown(3);

        // -- TITLE --
        doc.rect(50, 140, 495, 30).fill('#055923');
        doc.fillColor('white').font('Helvetica-Bold').fontSize(14).text('OFFICIAL WEBSITE INQUIRY', 50, 148, { align: 'center', width: 495 });
        doc.fillColor('black').moveDown(2);

        let y = 190;

        // -- DETAILS SECTION --
        const addField = (label, value) => {
            doc.font('Helvetica-Bold').fontSize(11).text(label + ':', 50, y);
            doc.font('Helvetica').fontSize(11).text(value || 'N/A', 150, y);
            y += 20;
        };

        addField('Date', new Date().toLocaleDateString());
        addField('Name', data.name);
        addField('Email', data.email);
        addField('Phone', data.contact_number);
        y += 10;

        doc.font('Helvetica-Bold').text('Subject:', 50, y);
        doc.font('Helvetica').text(data.subject, 150, y);
        y += 30;

        // -- MESSAGE SECTION --
        doc.rect(50, y, 495, 200).lineWidth(2).stroke('#921c1c'); // Red Box for message
        doc.font('Helvetica-Bold').fillColor('#055923').text('Message Content:', 60, y + 15);
        doc.fillColor('black').font('Helvetica').fontSize(10).text(data.message, 60, y + 35, { width: 475, align: 'justify' });

        // -- FOOTER --
        const footerY = 750;
        doc.fontSize(8).text('This document was automatically generated by the St. Bernadine School Website System.', 50, footerY, { align: 'center' });
        doc.end();
    });
};

const generateCareRequestPDF = (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // --- HEADER ---
        const logoPath = path.join(__dirname, 'asset/images/4d-logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 35, { width: 70 });
        }

        doc.font('Helvetica-Bold').fontSize(22).fillColor(PRIMARY_COLOR).text('ST. BERNADINE', 120, 42);
        doc.fontSize(12).fillColor(SECON_COLOR).text('HOME CARE SERVICES', 120, 68);

        doc.font('Helvetica').fontSize(9).fillColor('#888888').text('591 Summit Ave Suite 410, Jersey City, NJ 07306', 0, 45, { align: 'right', width: 555 });
        doc.text('Phone: +1 (201) 222-1116', 0, 58, { align: 'right', width: 555 });
        doc.text('school@stbernadineschoolofallied.com', 0, 71, { align: 'right', width: 555 });
        doc.text('www.stbernadineschoolofallied.com', 0, 84, { align: 'right', width: 555 });

        // --- TITLE ---
        doc.moveDown(4);
        doc.fillColor(SECON_COLOR).font('Helvetica-Bold').fontSize(8).text(`DATE RECEIVED: ${new Date().toLocaleDateString()}`, 40, 108, { align: 'right', width: 515 });

        // Use standard Hostinger-style header box
        doc.rect(40, 120, 515, 35).fill(PRIMARY_COLOR);
        doc.fillColor('white').font('Helvetica-Bold').fontSize(14).text('OFFICIAL HOME CARE SERVICE REQUEST', 40, 131, { align: 'center', width: 515 });

        let y = 180;

        const drawSectionHeader = (title) => {
            if (y + 40 > 780) { doc.addPage(); y = 50; }
            doc.rect(40, y, 515, 25).fill(BG_COLOR);
            doc.rect(40, y, 4, 25).fill(PRIMARY_COLOR);
            doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(12).text(title.toUpperCase(), 55, y + 7);
            y += 35;
        };

        const drawRow = (leftLabel, leftValue, rightLabel, rightValue) => {
            if (y + 30 > 780) { doc.addPage(); y = 50; }
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(9).text(leftLabel, 40, y);
            doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text(leftValue || 'N/A', 40, y + 12);

            if (rightLabel !== undefined) {
                doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(9).text(rightLabel, 310, y);
                doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text(rightValue || 'N/A', 310, y + 12);
            }
            doc.lineWidth(0.5).strokeColor(BORDER_COLOR).moveTo(40, y + 28).lineTo(555, y + 28).stroke();
            y += 40;
        };

        const drawFullRow = (label, value) => {
            const textHeight = doc.heightOfString(value || 'N/A', { width: 515, font: 'Helvetica-Bold', fontSize: 11 });
            const rowHeight = Math.max(28, textHeight + 16);

            if (y + rowHeight > 780) { doc.addPage(); y = 50; }

            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(9).text(label, 40, y);
            doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text(value || 'N/A', 40, y + 12, { width: 515 });

            doc.lineWidth(0.5).strokeColor(BORDER_COLOR).moveTo(40, y + rowHeight).lineTo(555, y + rowHeight).stroke();
            y += rowHeight + 10;
        };

        // --- CONTENT ---
        drawSectionHeader('Patient Information');
        drawRow('First Name', data.patientFirstName, 'Last Name', data.patientLastName);
        drawRow('Age', data.patientAge, 'Service Location', data.serviceLocation);

        drawSectionHeader('Contact Person Details');
        drawRow('Full Name', data.contactName, 'Relationship to Patient', data.relationship);
        drawRow('Phone Number', data.contactPhone, 'Email Address', data.contactEmail);

        drawSectionHeader('Care Requirements');
        drawRow('Type of Care Needed', data.careType, 'Estimated Start Date', data.startDate);

        drawFullRow('Specific Condition / Additional Details', data.careDetails);

        // --- AUTOMATIC FOOTER ---
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.lineWidth(1).strokeColor(PRIMARY_COLOR).moveTo(40, 800).lineTo(555, 800).stroke();
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(8)
                .text(`St. Bernadine Priorities - Home Care Service Request`, 40, 810, { lineBreak: false });
            doc.text(`Page ${i + 1} of ${pages.count}`, 0, 810, { align: 'right', width: 555, lineBreak: false });
        }

        doc.end();
    });
};

app.post('/send-contact', async (req, res) => {
    try {
        const { name, email, contact_number, subject, message } = req.body;
        console.log("Received contact Inquiry:", req.body);

        // Professional HTML Email Template
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Inquiry Received - Admin</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; color: #2d3748; }
                    .email-wrapper { width: 100%; background-color: #f4f5f7; padding: 40px 0; }
                    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                    .header { background: linear-gradient(135deg, #055923 0%, #033f18 100%); padding: 40px 30px; text-align: center; }
                    .logo-box { background: rgba(255,255,255,0.95); padding: 12px; border-radius: 12px; display: inline-block; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .logo { width: 110px; height: auto; display: block; }
                    .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px; text-transform: uppercase; }
                    .header p { color: #a7f3d0; font-size: 14px; margin: 0; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; }
                    .body { padding: 40px 40px 30px; background-color: #ffffff; }
                    .text { font-size: 16px; line-height: 1.6; color: #4a5568; margin: 0 0 24px 0; }
                    .info-box { background-color: #fcfcfc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 5px solid #921c1c; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
                    .info-label { margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
                    .info-value { margin: 0 0 15px 0; font-size: 18px; font-weight: 700; color: #055923; }
                    .info-value-small { margin: 0; font-size: 16px; font-weight: 600; color: #333; }
                    .info-contact { margin: 4px 0 0 0; font-size: 14px; color: #666; }
                    .info-contact a { color: #055923; text-decoration: none; }
                    .message-label { font-weight: bold; color: #333; margin-bottom: 10px; }
                    .message-box { background-color: #f4f6f8; padding: 20px; border-radius: 4px; color: #555; font-style: italic; line-height: 1.6; }
                    .footer { background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e6e6e6; }
                    .footer-brand { font-weight: 700; margin: 0; color: #055923; font-size: 16px; }
                    .footer-text { margin: 5px 0 15px; color: #64748b; font-size: 13px; }
                    .address { margin: 0; color: #94a3b8; font-size: 12px; }
                    .ref { display: none; }
                    @media (prefers-color-scheme: dark) {
                        body, .email-wrapper, .email-container, .body, .footer { background-color: #1a202c !important; color: #e2e8f0 !important; }
                        .text, .info-label, .footer-text, .address, .greeting, p, .info-contact, .message-label { color: #cbd5e1 !important; }
                        .footer-brand, .highlight, .info-value, .info-value-small { color: #a7f3d0 !important; }
                        .info-box, .message-box { background-color: #2d3748 !important; border-color: #4a5568 !important; color: #e2e8f0 !important; }
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <table class="email-container" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td class="header">
                                <div class="logo-box">
                                    <img src="https://hdlpermacodetech.github.io/stbernadineusaschoolofallied/asset/images/4d-logo.png" alt="St. Bernadine Logo" class="logo">
                                </div>
                                <h1>New Inquiry Received</h1>
                                <p>Admin Notification System</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="body">
                                <p class="text">A new message has been submitted via the website contact form.</p>
                                
                                <div class="info-box">
                                    <p class="info-label">Subject</p>
                                    <p class="info-value">"${subject}"</p>
                                    
                                    <p class="info-label">From</p>
                                    <p class="info-value-small">${name}</p>
                                    <p class="info-contact"><a href="mailto:${email}">${email}</a> | ${contact_number}</p>
                                </div>
                                
                                <p class="message-label">Message Content:</p>
                                <div class="message-box">
                                    "${message.replace(/\n/g, '<br>')}"
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p class="footer-brand">St. Bernadine School of Allied Health</p>
                                <p class="footer-text">Secure Admin Notification</p>
                                <p class="address">&copy; ${new Date().getFullYear()} St. Bernadine School. All rights reserved.</p>
                                <div class="ref" style="display:none;font-size:0px;color:transparent;line-height:0;">Ref: ${Date.now().toString(36).toUpperCase()}</div>
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `;

        // Define CC and BCC
        const ccEmail = "school@stbernadineusa.com";
        const bccEmail = null;

        // Send to stbernadines@gmail.com without PDF, with CC/BCC
        await sendEmail("hdlpermacodetech@stbernadineschoolofallied.com", `[Inquiry] ${subject} - ${name}`, htmlContent, null, email, ccEmail, bccEmail);

        // Auto-Reply to Inquirer
        const autoReplySubject = "We received your message - St. Bernadine School of Allied Health";
        const autoReplyHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Message Received - St. Bernadine</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; color: #2d3748; }
                    .email-wrapper { width: 100%; background-color: #f4f5f7; padding: 40px 0; }
                    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                    .header { background: linear-gradient(135deg, #055923 0%, #033f18 100%); padding: 40px 30px; text-align: center; }
                    .logo-box { background: rgba(255,255,255,0.95); padding: 12px; border-radius: 12px; display: inline-block; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .logo { width: 110px; height: auto; display: block; }
                    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px; }
                    .header p { color: #a7f3d0; font-size: 15px; margin: 0; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
                    .body { padding: 40px 40px 30px; background-color: #ffffff; }
                    .greeting { font-size: 20px; font-weight: 600; color: #1a202c; margin: 0 0 20px 0; }
                    .text { font-size: 16px; line-height: 1.6; color: #4a5568; margin: 0 0 24px 0; }
                    .info-box { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 30px 0; border-left: 4px solid #055923; }
                    .info-box p { margin: 0; font-size: 16px; color: #2d3748; line-height: 1.5; }
                    .highlight { color: #055923; font-weight: 700; }
                    .next-steps { margin-top: 30px; padding-top: 30px; border-top: 1px solid #edf2f7; }
                    .signature { margin-top: 30px; }
                    .signature p { margin: 0; color: #4a5568; }
                    .signature-name { font-weight: 700; color: #1a202c; font-size: 18px; margin-top: 4px !important; }
                    .footer { background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #edf2f7; }
                    .footer-brand { font-weight: 700; color: #2d3748; font-size: 16px; margin: 0 0 8px 0; }
                    .footer-text { color: #718096; font-size: 13px; margin: 0 0 20px 0; }
                    .social-links { margin-bottom: 24px; }
                    .social-links img { width: 24px; height: 24px; margin: 0 8px; filter: grayscale(100%) opacity(60%); transition: all 0.3s ease; }
                    .address { color: #a0aec0; font-size: 12px; margin: 0 0 16px 0; line-height: 1.5; }
                    .links { margin: 0; }
                    .links a { color: #055923; text-decoration: none; font-size: 12px; font-weight: 500; margin: 0 8px; }
                    .ref { display: none; }
                    @media (prefers-color-scheme: dark) {
                        body, .email-wrapper, .email-container, .body, .footer { background-color: #1a202c !important; color: #e2e8f0 !important; }
                        .text, .info-label, .footer-text, .address, .greeting, p, .signature-name { color: #cbd5e1 !important; }
                        .footer-brand, .highlight, .info-value, .info-value-small, .links a { color: #a7f3d0 !important; }
                        .info-box, .message-box { background-color: #2d3748 !important; border-color: #4a5568 !important; }
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <table class="email-container" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td class="header">
                                <div class="logo-box">
                                    <img src="https://hdlpermacodetech.github.io/stbernadineusaschoolofallied/asset/images/4d-logo.png" alt="St. Bernadine Logo" class="logo">
                                </div>
                                <h1>Message Received</h1>
                                <p>St. Bernadine School of Allied Health</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="body">
                                <p class="greeting">Hi ${name},</p>
                                <p class="text">Thank you for taking the time to contact St. Bernadine School of Allied Health.</p>
                                
                                <div class="info-box">
                                    <p>We have safely received your inquiry regarding: <br><br><span class="highlight">"${subject}"</span></p>
                                </div>
                                
                                <div class="next-steps">
                                    <p class="text">Our administrative team is actively reviewing your message. We aim to respond to all inquiries as comprehensively as possible, typically within 24 business hours.</p>
                                </div>
                                
                                <div class="signature">
                                    <p>Warm regards,</p>
                                    <p class="signature-name">Administration</p>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p class="footer-brand">St. Bernadine School of Allied Health</p>
                                <p class="footer-text">Excellence in Healthcare Education Since 1986</p>
                                
                                <div class="social-links">
                                    <a href="https://facebook.com"><img src="https://img.icons8.com/ios-filled/50/000000/facebook-new.png" alt="Facebook"></a>
                                    <a href="https://instagram.com"><img src="https://img.icons8.com/ios-filled/50/000000/instagram-new.png" alt="Instagram"></a>
                                    <a href="https://linkedin.com"><img src="https://img.icons8.com/ios-filled/50/000000/linkedin.png" alt="LinkedIn"></a>
                                </div>
                                
                                <p class="address">
                                    591 Summit Ave Suite 410<br>
                                    Jersey City, NJ 07306<br>
                                    &copy; ${new Date().getFullYear()} St. Bernadine School. All rights reserved.
                                </p>
                                
                                <p class="links">
                                    <a href="https://stbernadineschoolofallied.com/privacy.html">Privacy Policy</a> &bull; 
                                    <a href="https://stbernadineschoolofallied.com/contact.html">Contact Us</a>
                                </p>
                                <div class="ref" style="display:none;font-size:0px;color:transparent;line-height:0;">Ref: ${Date.now().toString(36).toUpperCase()}</div>
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `;

        await sendEmail(email, autoReplySubject, autoReplyHtml);
        res.status(200).json({ message: 'Message Sent Successfully!' });

    } catch (error) {
        console.error("Error processing contact form:", error);
        res.status(500).json({ error: 'Error: ' + error.message });
    }
});

app.post('/request-care', async (req, res) => {
    try {
        const {
            firstName, lastName, contactPhone, contactEmail,
            careType, startDate, careDetails
        } = req.body;

        console.log("Received Home Care Request:", req.body);

        // Admin HTML Email
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Home Care Inquiry - Admin</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; }
                    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                    .header { background: linear-gradient(135deg, #055923 0%, #033f18 100%); padding: 30px; text-align: center; color: white; }
                    .header h1 { margin: 0 0 5px 0; font-size: 22px; }
                    .header p { margin: 0; color: #a7f3d0; font-size: 14px; text-transform: uppercase; }
                    .body { padding: 30px; }
                    .info-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #055923; }
                    .info-label { font-size: 12px; text-transform: uppercase; color: #6b7280; margin: 0 0 4px 0; }
                    .info-value { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 15px 0; }
                    .info-value:last-child { margin-bottom: 0; }
                    .grid { display: table; width: 100%; }
                    .col { display: table-cell; width: 50%; }
                    .message-box { background-color: #f3f4f6; padding: 15px; border-radius: 6px; font-style: italic; color: #374151; }
                    .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
                    @media (prefers-color-scheme: dark) {
                        body, .email-container, .body, .footer { background-color: #1a202c !important; color: #e2e8f0 !important; }
                        p, .info-label, h3 { color: #cbd5e1 !important; }
                        .info-value, strong { color: #a7f3d0 !important; }
                        .info-box, .message-box { background-color: #2d3748 !important; border-color: #4a5568 !important; color: #e2e8f0 !important; }
                        .info-value a { color: #a7f3d0 !important; }
                        .footer p { color: #818cf8 !important; } 
                    }
                </style>
            </head>
            <body>
                <table class="email-container" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        <td class="header">
                            <h1>New Home Care Inquiry</h1>
                            <p>St. Bernadine Priorities</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="body">
                            <h3 style="color:#111827;">Contact Person Details</h3>
                            <div class="info-box" style="border-left-color: #d97706;">
                                <p class="info-label">Name</p>
                                <p class="info-value">${firstName} ${lastName}</p>
                                <p class="info-label">Contact Details</p>
                                <p class="info-value">Phone: ${contactPhone}<br>Email: <a href="mailto:${contactEmail}">${contactEmail}</a></p>
                            </div>

                            <h3 style="color:#111827;">Inquiry Details</h3>
                            <div class="info-box" style="border-left-color: #2563eb;">
                                <div class="grid">
                                    <div class="col">
                                        <p class="info-label">Type of Care</p>
                                        <p class="info-value">${careType}</p>
                                    </div>
                                    <div class="col">
                                        <p class="info-label">Est. Start Date</p>
                                        <p class="info-value">${startDate}</p>
                                    </div>
                                </div>
                                <p class="info-label" style="margin-top:10px;">Specific Condition / Requirements</p>
                                <div class="message-box">${careDetails ? careDetails.replace(/\n/g, '<br>') : 'None provided'}</div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <p style="margin:0;">&copy; ${new Date().getFullYear()} St. Bernadine School of Allied Health. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        // Setting Admin notification recipients
        const adminEmail = "hdlpermacodetech@stbernadineschoolofallied.com";
        const ccEmail = "homecare@stbernadineusa.com";
        const adminSubject = `[HOME CARE INQUIRY] from ${firstName} ${lastName}`;

        // Don't generate a PDF for a simple inquiry
        await sendEmail(adminEmail, adminSubject, htmlContent, null, contactEmail, ccEmail, null);

        // Auto-reply HTML Email to the Inquirer
        const autoReplyHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Home Care Request Received</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; }
                    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                    .header { background: linear-gradient(135deg, #055923 0%, #033f18 100%); padding: 30px; text-align: center; color: white; }
                    .header h1 { margin: 0 0 5px 0; font-size: 24px; }
                    .body { padding: 40px; color: #374151; line-height: 1.6; }
                    .highlight-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 25px 0; color: #166534; }
                    .footer { background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; }
                    @media (prefers-color-scheme: dark) {
                        body, .email-container, .body, .footer { background-color: #1a202c !important; color: #e2e8f0 !important; }
                        p, h2, a { color: #cbd5e1 !important; }
                        strong, .footer p:first-child { color: #a7f3d0 !important; }
                        .highlight-box { background-color: #2d3748 !important; border-color: #4a5568 !important; color: #e2e8f0 !important; }
                    }
                </style>
            </head>
            <body>
                <table class="email-container" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        <td class="header">
                            <h1>Request Received</h1>
                            <p style="margin:0; color:#a7f3d0;">St. Bernadine Home Care Services</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="body">
                            <h2 style="margin-top:0; color:#111827;">Hello ${firstName},</h2>
                            <p>Thank you for reaching out to St. Bernadine School of Allied Health regarding home care services.</p>
                            
                            <div class="highlight-box">
                                <p style="margin:0;"><strong>We have successfully received your inquiry for ${careType}</strong>. Our priority is ensuring the comfort and well-being of your loved ones.</p>
                            </div>

                            <p>A dedicated Care Coordinator is currently reviewing your inquiry. We will contact you at <strong>${contactPhone}</strong> within the next 24 hours to discuss your needs and answer any questions you may have.</p>
                            
                            <p>If you have any immediate concerns, please do not hesitate to drop us a call at <a href="tel:+12012221116" style="color:#055923; text-decoration:none; font-weight:bold;">+1 (201) 222-1116</a>.</p>
                            
                            <p style="margin-bottom:0; margin-top:30px;">Warmly,</p>
                            <p style="margin:0; font-weight:bold; color:#111827;">St. Bernadine Home Care Team</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <p style="margin:0 0 10px 0; font-weight:bold; color:#055923;">St. Bernadine School of Allied Health</p>
                            <p style="margin:0;">591 Summit Ave Suite 410, Jersey City, NJ 07306</p>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        await sendEmail(contactEmail, `We received your Care Inquiry`, autoReplyHtml, null, null, null, null);

        res.status(200).json({ message: 'Care Request Submitted Successfully!' });

    } catch (error) {
        console.error("Error processing request care form:", error);
        res.status(500).json({ error: 'Error: ' + error.message });
    }
});

// --- GENERATE JOB APPLICATION PDF ---
const generateJobApplicationPDF = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 0, size: 'LETTER', bufferPages: true });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const { firstName, lastName, contactPhone, contactEmail, address, position, startDate, AppMethod } = data;

            // Brand Colors - Premium Professional 
            const primaryColor = '#055923'; // Deep Green
            const accentColor = '#10b981'; // Bright green accent
            const textDark = '#1f2937';
            const textLight = '#6b7280';
            const bgLight = '#f8fafc';

            const marginX = 50;
            const contentWidth = doc.page.width - (marginX * 2);

            // --- HEADER BANNER ---
            doc.rect(0, 0, doc.page.width, 140).fill(primaryColor);
            doc.rect(0, 140, doc.page.width, 4).fill(accentColor); // Accent divider

            // Header Text
            doc.fillColor('#ffffff').fontSize(36).font('Helvetica-Bold').text(`${firstName} ${lastName}`.toUpperCase(), marginX, 40);

            doc.fontSize(14).font('Helvetica').fillColor('#a7f3d0')
                .text(`Application: ${position}  |  Available: ${startDate}`, marginX, 85);

            // Contact Info
            let contactArr = [address, contactPhone, contactEmail, data.linkedin, data.portfolio].filter(Boolean);
            doc.fontSize(10).font('Helvetica').fillColor('#e2e8f0')
                .text(contactArr.join('   •   '), marginX, 110, { width: contentWidth });

            // Ensure photo fits in header if present
            if (data.photoPath) {
                const photoSize = 80;
                doc.save();
                doc.roundedRect(doc.page.width - marginX - photoSize, 30, photoSize, photoSize, 4).clip();
                doc.image(data.photoPath, doc.page.width - marginX - photoSize, 30, { width: photoSize, height: photoSize });
                doc.restore();
                doc.roundedRect(doc.page.width - marginX - photoSize, 30, photoSize, photoSize, 4).lineWidth(2).strokeColor('#ffffff').stroke();
            }

            // Set initial cursor position for body content
            doc.y = 170;
            doc.x = marginX;

            const ensureSpace = (space) => {
                if (doc.y + space > doc.page.height - 80) {
                    doc.addPage();
                    doc.y = 50;
                }
            };

            const addSectionHeader = (title) => {
                ensureSpace(60);
                doc.moveDown(1);
                const startY = doc.y;
                doc.rect(marginX, startY, contentWidth, 26).fill(bgLight);
                doc.rect(marginX, startY, 4, 26).fill(primaryColor); // left thick border
                doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text(title.toUpperCase(), marginX + 15, startY + 8);
                doc.y = startY + 40;
                doc.x = marginX;
            };

            const addText = (text, options = {}) => {
                if (!text) return;
                doc.fillColor(textDark).fontSize(10).font(options.font || 'Helvetica')
                    .text(text, marginX, doc.y, { align: 'left', width: contentWidth, ...options });
                doc.moveDown(0.5);
            };

            if (AppMethod === 'manual') {
                // PROFESSIONAL SUMMARY
                if (data.ProfessionalSummary) {
                    addSectionHeader('Professional Summary');
                    addText(data.ProfessionalSummary, { lineGap: 2 });
                }

                // CORE COMPETENCIES
                if (data.CoreCompetencies) {
                    addSectionHeader('Core Competencies');

                    // Render dynamically like tags
                    const cTags = data.CoreCompetencies.split(',').map(s => s.trim()).filter(Boolean);
                    if (cTags.length > 0 && cTags.length <= 15) {
                        let tagX = marginX;
                        let tagY = doc.y;
                        cTags.forEach(tag => {
                            const w = doc.widthOfString(tag) + 20;
                            if (tagX + w > marginX + contentWidth) {
                                tagX = marginX;
                                tagY += 30;
                            }
                            doc.roundedRect(tagX, tagY, w, 22, 11).fill('#e2e8f0');
                            doc.fillColor(textDark).fontSize(9).font('Helvetica-Bold').text(tag, tagX + 10, tagY + 6);
                            tagX += w + 10;
                        });
                        doc.y = tagY + 35;
                    } else {
                        addText(data.CoreCompetencies, { lineGap: 2 });
                    }
                }

                // PROFESSIONAL EXPERIENCE
                if (data.Job1Title || data.Job2Title) {
                    addSectionHeader('Professional Experience');

                    const renderJob = (title, company, dates, details) => {
                        if (!title) return;
                        ensureSpace(80);

                        const startY = doc.y;
                        doc.fillColor(textDark).fontSize(12).font('Helvetica-Bold').text(title, marginX, startY);
                        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(company || '', marginX, startY + 16);

                        const dateW = doc.widthOfString(dates || '');
                        doc.fillColor(textLight).fontSize(10).font('Helvetica-Oblique').text(dates || '', marginX + contentWidth - dateW, startY + 16);

                        doc.y = startY + 36;
                        addText(details, { lineGap: 2 });
                        doc.moveDown(1);
                    };

                    renderJob(data.Job1Title, data.Job1Company, data.Job1Dates, data.Job1Details);
                    renderJob(data.Job2Title, data.Job2Company, data.Job2Dates, data.Job2Details);
                }

                // EDUCATION
                if (data.EduDegree) {
                    addSectionHeader('Education');
                    ensureSpace(60);

                    const startY = doc.y;
                    doc.fillColor(textDark).fontSize(12).font('Helvetica-Bold').text(data.EduDegree, marginX, startY);
                    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(data.EduSchool || '', marginX, startY + 16);

                    const dateW = doc.widthOfString(data.EduDates || '');
                    doc.fillColor(textLight).fontSize(10).font('Helvetica-Oblique').text(data.EduDates || '', marginX + contentWidth - dateW, startY + 16);

                    doc.y = startY + 36;
                    addText(data.EduDetails, { lineGap: 2 });
                }

                // CERTIFICATIONS & TRAINING
                if (data.CertsTraining) {
                    addSectionHeader('Certifications & Training');
                    addText(data.CertsTraining, { lineGap: 2 });
                }

                // REFERENCES
                if (data.References) {
                    addSectionHeader('References');
                    addText(data.References, { lineGap: 2 });
                }

                // SIGNATURE
                if (data.SignatureData) {
                    ensureSpace(160);

                    doc.moveDown(1);
                    let sigStartY = doc.y;
                    doc.rect(marginX, sigStartY, contentWidth, 1).fill('#e2e8f0');
                    doc.y = sigStartY + 15;

                    doc.fillColor(textLight).fontSize(9).font('Helvetica-Oblique')
                        .text('I certify that all information provided in this application is true and complete to the best of my knowledge.', marginX, doc.y, { width: contentWidth });

                    doc.y += 20;

                    const base64Data = data.SignatureData.replace(/^data:image\/png;base64,/, "");
                    const sigImg = Buffer.from(base64Data, 'base64');
                    // Draw signature
                    doc.image(sigImg, marginX, doc.y, { height: 45 });

                    doc.y += 50;
                    doc.moveTo(marginX, doc.y).lineTo(marginX + 200, doc.y).lineWidth(1).strokeColor(textDark).stroke();

                    doc.y += 5;
                    doc.fillColor(textDark).fontSize(11).font('Helvetica-Bold').text(`${firstName} ${lastName}`, marginX, doc.y);
                    doc.fillColor(textLight).fontSize(10).font('Helvetica').text(new Date().toLocaleDateString(), marginX, doc.y + 15);
                    doc.moveDown(2);
                }

            } else {
                // RESUME UPLOAD
                if (data.coverLetter && data.coverLetter.trim() !== '') {
                    addSectionHeader('Cover Letter');
                    addText(data.coverLetter, { lineGap: 2 });
                } else {
                    addSectionHeader('Application Note');
                    doc.fillColor(textLight).fontSize(11).font('Helvetica-Oblique').text('The applicant chose to upload a resume file directly. Please refer to the attached document for their full professional profile.', marginX, doc.y, { width: contentWidth });
                }
            }

            // Global Footer for all pages
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(bgLight);
                doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica')
                    .text(`Generated automatically by St. Bernadine School of Allied Health - Internal HR System. Date: ${new Date().toLocaleDateString()}`,
                        0, doc.page.height - 24, { align: 'center', width: doc.page.width });
            }

            doc.end();
        } catch (error) {
            console.error("PDFKit Jobs Error:", error);
            reject(error);
        }
    });
};

// --- POST ENDPOINT: APPLY FOR A JOB ---
app.post('/apply-job', upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'applicantPhoto', maxCount: 1 }]), async (req, res) => {
    try {
        const { firstName, lastName, contactPhone, contactEmail, address, position, startDate, coverLetter, AppMethod, SignatureData } = req.body;

        if (!firstName || !lastName || !contactPhone || !contactEmail || !position || !startDate) {
            return res.status(400).json({ error: 'Missing required applicant fields.' });
        }

        const files = req.files || {};

        if (AppMethod === 'upload' && !files['resume']) {
            return res.status(400).json({ error: 'Resume file is required.' });
        }

        if (AppMethod === 'manual') {
            if (!files['applicantPhoto']) return res.status(400).json({ error: 'Professional photo is required.' });
            if (!SignatureData) return res.status(400).json({ error: 'Signature is required.' });
        }

        // Attach photo path to data for PDF generator if it exists
        const pdfData = { ...req.body };
        if (files['applicantPhoto']) {
            pdfData.photoPath = files['applicantPhoto'][0].path;
        }

        // Generate Application Summary PDF
        const pdfBuffer = await generateJobApplicationPDF(pdfData);

        // Admin Notification Email
        const adminEmail = "hdlpermacodetech@stbernadineschoolofallied.com";
        const ccEmail = "homecare@stbernadineusa.com";
        const adminSubject = `[JOB APPLICATION] ${position} - ${firstName} ${lastName}`;

        const adminHtmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f5f7; padding: 20px; }
                    .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: auto; }
                    h2 { color: #055923; margin-top: 0; }
                    .info-box { background: #f8fafc; padding: 15px; border-left: 4px solid #055923; margin-bottom: 20px; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>New Job Application Received</h2>
                    <p>A new candidate has submitted an application for the <strong>${position}</strong> role.</p>
                    <div class="info-box">
                        <p><strong>Applicant:</strong> ${firstName} ${lastName}</p>
                        <p><strong>Email:</strong> ${contactEmail}</p>
                        <p><strong>Phone:</strong> ${contactPhone}</p>
                        <p><strong>Available Start Date:</strong> ${startDate}</p>
                        <p><strong>Method:</strong> ${AppMethod === 'manual' ? 'Detailed Manual Form' : 'Resume Upload'}</p>
                    </div>
                    <p>Attached to this email, you will find:</p>
                    <ol>
                        <li>A PDF summary of their application details</li>
                        ${files['resume'] ? `<li>The Applicant's uploaded Resume (${files['resume'][0].originalname})</li>` : ''}
                        ${files['applicantPhoto'] ? `<li>The Applicant's uploaded professional photo</li>` : ''}
                    </ol>
                    <p style="font-size: 12px; color: #64748b; margin-top: 30px;">System-generated email via St. Bernadine Careers Portal.</p>
                </div>
            </body>
            </html>
        `;

        const attachments = [
            {
                filename: `APP_SUMMARY_${firstName}_${lastName}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ];

        if (files['resume']) {
            attachments.push({
                filename: `RESUME_${firstName}_${lastName}_${path.extname(files['resume'][0].originalname)}`,
                path: files['resume'][0].path
            });
        }

        if (files['applicantPhoto']) {
            attachments.push({
                filename: `PHOTO_${firstName}_${lastName}_${path.extname(files['applicantPhoto'][0].originalname)}`,
                path: files['applicantPhoto'][0].path
            });
        }

        // Send to HR / Admin
        await sendEmail(adminEmail, adminSubject, adminHtmlContent, attachments, contactEmail, ccEmail, null);

        // Auto-reply HTML Email to the Applicant
        const autoReplyHtml = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background-color: #f4f5f7; padding: 30px; }
                        .container { background: white; max-width: 600px; margin: auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #055923 0%, #033f18 100%); padding: 30px; text-align: center; color: white; }
                        .body { padding: 40px; color: #374151; line-height: 1.6; }
                        .highlight { font-weight: bold; color: #055923; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0; font-size: 24px;">Application Received</h1>
                            <p style="margin: 5px 0 0 0; color: #a7f3d0;">St. Bernadine Careers</p>
                        </div>
                        <div class="body">
                            <h2>Hello ${firstName},</h2>
                            <p>Thank you for expressing interest in joining our team at <strong>St. Bernadine School of Allied Health</strong>. We have successfully received your application for the <span class="highlight">${position}</span> role.</p>
                            <p>Our Human Resources team is currently reviewing your qualifications to see how they align with our current needs. Should your profile be a strong match, we will contact you directly at <strong>${contactPhone}</strong> or via this email address to schedule an interview.</p>
                            <p>We appreciate the time you took to apply.</p>
                            <p style="margin-top: 30px;">Best Regards,<br><strong>Human Resources Team</strong><br>St. Bernadine School of Allied Health</p>
                        </div>
                    </div>
                </body>
            </html>
        `;

        await sendEmail(contactEmail, `Your Application for ${position} - St. Bernadine`, autoReplyHtml, null, null, null, null);

        // Cleanup: remove uploaded files
        if (files['resume']) {
            fs.unlink(files['resume'][0].path, (err) => {
                if (err) console.error("Failed to delete temp resume file:", err);
            });
        }
        if (files['applicantPhoto']) {
            fs.unlink(files['applicantPhoto'][0].path, (err) => {
                if (err) console.error("Failed to delete temp photo file:", err);
            });
        }

        res.status(200).json({ message: 'Application submitted successfully!' });

    } catch (error) {
        console.error("Error processing job application form:", error);
        res.status(500).json({ error: 'Error: ' + error.message });
    }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Health Check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Using Nodemailer SMTP for emails`);
    console.log(`Gemini Chatbot: ${chatModel ? 'ACTIVE' : 'INACTIVE (Fallback Mode)'} `);
});
