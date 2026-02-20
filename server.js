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
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Force WWW Redirect
app.use((req, res, next) => {
    if (req.header('host').slice(0, 4) !== 'www.' && !req.header('host').includes('localhost') && !req.header('host').includes('127.0.0.1')) {
        res.redirect(301, 'https://www.stbernadineschoolofallied.com' + req.url);
    } else {
        next();
    }
});

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
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <!-- Header -->
                <div style="background-color: #055923; padding: 40px 20px; text-align: center;">
                    <img src="https://hdlpermacodetech.github.io/stbernadineusaschoolofallied/asset/images/4d-logo.png" alt="St. Bernadine Logo" style="width: 120px; height: auto; margin-bottom: 20px; background: #ffffff; padding: 10px; border-radius: 4px; pointer-events: none; user-select: none; -webkit-user-select: none;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">New Application Received</h1>
                    <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 14px; font-weight: 500; letter-spacing: 1px;">Admin Notification System</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 50px 40px; color: #333333; line-height: 1.8;">
                    <p style="font-size: 16px; margin-bottom: 25px; color: #555;">A new student application has been submitted via the website.</p>
                    
                    <div style="background-color: #fcfcfc; border-left: 5px solid #921c1c; padding: 25px; margin: 30px 0; border-radius: 0 4px 4px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                        <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px;">Applicant</p>
                        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #055923;">${data.firstName} ${data.lastName}</p>
                        
                        <div style="margin: 20px 0; border-top: 1px solid #eee;"></div>

                        <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px;">Program</p>
                        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #055923;">${data.Program}</p>
                    </div>

                    <p style="font-size: 16px; margin-bottom: 25px; color: #555;">Please find the full application details in the attached PDF.</p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e6e6e6;">
                    <p style="font-weight: 700; margin: 0; color: #055923; font-size: 16px;">St. Bernadine School of Allied Health</p>
                    <p style="margin: 5px 0 15px; color: #64748b; font-size: 13px;">Secure Admin Notification</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} St. Bernadine School. All rights reserved.</p>
                    <div style="display:none; max-height:0px; overflow:hidden;">Ref: ${Date.now().toString(36).toUpperCase()}</div>
                </div>
            </div>
        `;

        // Define CC and BCC
        const ccEmail = "llagashebreydill1996@gmail.com";
        const bccEmail = null;

        await sendEmail("hdlpermacodetech@stbernadineschoolofallied.com", `New Application: ${data.firstName} ${data.lastName}`, htmlContent, attachments, data.email, ccEmail, bccEmail);

        // Auto-Reply to Applicant
        const autoReplySubject = "Application Received - St. Bernadine School of Allied Health";
        const autoReplyHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <!-- Header -->
                <div style="background-color: #055923; padding: 40px 20px; text-align: center;">
                    <img src="https://hdlpermacodetech.github.io/stbernadineusaschoolofallied/asset/images/4d-logo.png" alt="St. Bernadine Logo" style="width: 120px; height: auto; margin-bottom: 20px; background: #ffffff; padding: 10px; border-radius: 4px; pointer-events: none; user-select: none; -webkit-user-select: none;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">Application Received</h1>
                    <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 14px; font-weight: 500; letter-spacing: 1px;">St. Bernadine School of Allied Health</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 50px 40px; color: #333333; line-height: 1.8;">
                    <p style="font-size: 18px; margin-bottom: 25px; color: #055923; font-weight: 600;">Dear ${data.firstName},</p>
                    <p style="font-size: 16px; margin-bottom: 25px; color: #555;">Thank you for choosing St. Bernadine School of Allied Health for your professional journey.</p>
                    
                    <div style="background-color: #fcfcfc; border-left: 5px solid #921c1c; padding: 25px; margin: 30px 0; border-radius: 0 4px 4px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                        <p style="margin: 0; font-size: 16px; color: #444;">We have successfully received your application for the <strong style="color: #921c1c;">${data.Program}</strong> program.</p>
                    </div>

                    <p style="font-size: 16px; margin-bottom: 25px; color: #555;">Our admissions team is currently reviewing your details. We will contact you shortly regarding the next steps in your enrollment process.</p>
                    
                    <p style="font-size: 16px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f0f0;">Best regards,</p>
                    <p style="font-size: 18px; font-weight: bold; color: #055923; margin-top: 5px;">Admissions Team</p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 40px 30px; text-align: center; border-top: 1px solid #e6e6e6;">
                    <div style="margin-bottom: 25px;">
                        <p style="font-weight: 700; margin: 0; color: #055923; font-size: 16px;">St. Bernadine School of Allied Health</p>
                        <p style="margin: 5px 0 25px; color: #64748b; font-size: 13px;">Excellence in Healthcare Education Since 1986</p>
                    </div>

                    <div style="margin-bottom: 30px;">
                        <a href="https://facebook.com" style="text-decoration: none; margin: 0 12px;"><img src="https://img.icons8.com/ios-filled/50/055923/facebook-new.png" alt="Facebook" style="width: 26px; height: 26px;"></a>
                        <a href="https://instagram.com" style="text-decoration: none; margin: 0 12px;"><img src="https://img.icons8.com/ios-filled/50/055923/instagram-new.png" alt="Instagram" style="width: 26px; height: 26px;"></a>
                        <a href="https://linkedin.com" style="text-decoration: none; margin: 0 12px;"><img src="https://img.icons8.com/ios-filled/50/055923/linkedin.png" alt="LinkedIn" style="width: 26px; height: 26px;"></a>
                    </div>
                    
                    <p style="margin: 0 0 10px; color: #94a3b8; font-size: 12px;">591 Summit Ave Suite 410, Jersey City, NJ 07306</p>
                    <p style="margin: 0 0 15px; color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} St. Bernadine School. All rights reserved.</p>

                    <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 5px;">
                        <a href="https://stbernadineschoolofallied.com/privacy.html" style="color: #94a3b8; text-decoration: none; margin: 0 8px;">Privacy Policy</a> | 
                        <a href="https://stbernadineschoolofallied.com/contact.html" style="color: #94a3b8; text-decoration: none; margin: 0 8px;">Contact Us</a>
                    </div>
                    <div style="display:none; max-height:0px; overflow:hidden;">Ref: ${Date.now().toString(36).toUpperCase()}</div>
                </div>
            </div>
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

app.post('/send-contact', async (req, res) => {
    try {
        const { name, email, contact_number, subject, message } = req.body;
        console.log("Received contact Inquiry:", req.body);

        // Professional HTML Email Template
        const htmlContent = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <!-- Header -->
                <div style="background-color: #055923; padding: 40px 20px; text-align: center;">
                    <img src="https://hdlpermacodetech.github.io/stbernadineusaschoolofallied/asset/images/4d-logo.png" alt="St. Bernadine Logo" style="width: 120px; height: auto; margin-bottom: 20px; background: #ffffff; padding: 10px; border-radius: 4px; pointer-events: none; user-select: none; -webkit-user-select: none;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">New Inquiry Received</h1>
                    <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 14px; font-weight: 500; letter-spacing: 1px;">Admin Notification System</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 50px 40px; color: #333333; line-height: 1.8;">
                    <p style="font-size: 16px; margin-bottom: 25px; color: #555;">A new message has been submitted via the website contact form.</p>
                    
                    <div style="background-color: #fcfcfc; border-left: 5px solid #921c1c; padding: 25px; margin: 30px 0; border-radius: 0 4px 4px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                        <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px;">Subject</p>
                        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #055923; margin-bottom: 15px;">"${subject}"</p>
                        
                        <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px;">From</p>
                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #333;">${name}</p>
                        <p style="margin: 0; font-size: 14px; color: #666;"><a href="mailto:${email}" style="color: #055923; text-decoration: none;">${email}</a> | ${contact_number}</p>
                    </div>

                    <p style="font-weight: bold; color: #333; margin-bottom: 10px;">Message Content:</p>
                    <div style="background-color: #f4f6f8; padding: 20px; border-radius: 4px; color: #555; font-style: italic; line-height: 1.6;">
                        "${message.replace(/\n/g, '<br>')}"
                    </div>

                    <p style="font-size: 14px; margin-top: 30px; color: #888; text-align: center;"></p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e6e6e6;">
                    <p style="font-weight: 700; margin: 0; color: #055923; font-size: 16px;">St. Bernadine School of Allied Health</p>
                    <p style="margin: 5px 0 15px; color: #64748b; font-size: 13px;">Secure Admin Notification</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} St. Bernadine School. All rights reserved.</p>
                    <div style="display:none; max-height:0px; overflow:hidden;">Ref: ${Date.now().toString(36).toUpperCase()}</div>
                </div>
            </div>
        `;

        // Define CC and BCC
        const ccEmail = "llagashebreydill1996@gmail.com";
        const bccEmail = null;

        // Send to stbernadines@gmail.com without PDF, with CC/BCC
        await sendEmail("hdlpermacodetech@stbernadineschoolofallied.com", `[Inquiry] ${subject} - ${name}`, htmlContent, null, email, ccEmail, bccEmail);

        // Auto-Reply to Inquirer
        const autoReplySubject = "We received your message - St. Bernadine School of Allied Health";
        const autoReplyHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <!-- Header -->
                <div style="background-color: #055923; padding: 40px 20px; text-align: center;">
                    <img src="https://hdlpermacodetech.github.io/stbernadineusaschoolofallied/asset/images/4d-logo.png" alt="St. Bernadine Logo" style="width: 120px; height: auto; margin-bottom: 20px; background: #ffffff; padding: 10px; border-radius: 4px; pointer-events: none; user-select: none; -webkit-user-select: none;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">Message Received</h1>
                    <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 14px; font-weight: 500; letter-spacing: 1px;">St. Bernadine School of Allied Health</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 50px 40px; color: #333333; line-height: 1.8;">
                    <p style="font-size: 18px; margin-bottom: 25px; color: #055923; font-weight: 600;">Dear ${name},</p>
                    <p style="font-size: 16px; margin-bottom: 25px; color: #555;">Thank you for contacting St. Bernadine School of Allied Health.</p>
                    
                    <div style="background-color: #fcfcfc; border-left: 5px solid #921c1c; padding: 25px; margin: 30px 0; border-radius: 0 4px 4px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                        <p style="margin: 0; font-size: 16px; color: #444;">We have successfully received your inquiry regarding <strong style="color: #921c1c;">"${subject}"</strong>.</p>
                    </div>

                    <p style="font-size: 16px; margin-bottom: 25px; color: #555;">Our team is reviewing your message and will respond as soon as possible, usually within 24 hours.</p>
                    
                    <p style="font-size: 16px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f0f0;">Best regards,</p>
                    <p style="font-size: 18px; font-weight: bold; color: #055923; margin-top: 5px;">Administration</p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 40px 30px; text-align: center; border-top: 1px solid #e6e6e6;">
                    <div style="margin-bottom: 25px;">
                        <p style="font-weight: 700; margin: 0; color: #055923; font-size: 16px;">St. Bernadine School of Allied Health</p>
                    </div>
                     <div style="margin-bottom: 30px;">
                        <a href="https://facebook.com" style="text-decoration: none; margin: 0 12px;"><img src="https://img.icons8.com/ios-filled/50/055923/facebook-new.png" alt="Facebook" style="width: 26px; height: 26px;"></a>
                        <a href="https://instagram.com" style="text-decoration: none; margin: 0 12px;"><img src="https://img.icons8.com/ios-filled/50/055923/instagram-new.png" alt="Instagram" style="width: 26px; height: 26px;"></a>
                        <a href="https://linkedin.com" style="text-decoration: none; margin: 0 12px;"><img src="https://img.icons8.com/ios-filled/50/055923/linkedin.png" alt="LinkedIn" style="width: 26px; height: 26px;"></a>
                    </div>
                    <p style="margin: 0 0 10px; color: #94a3b8; font-size: 12px;">591 Summit Ave Suite 410, Jersey City, NJ 07306</p>
                    <p style="margin: 0 0 15px; color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} St. Bernadine School. All rights reserved.</p>
                    <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 5px;">
                        <a href="https://stbernadineschoolofallied.com/privacy.html" style="color: #94a3b8; text-decoration: none; margin: 0 8px;">Privacy Policy</a> | 
                        <a href="https://stbernadineschoolofallied.com/contact.html" style="color: #94a3b8; text-decoration: none; margin: 0 8px;">Contact Us</a>
                    </div>
                    <div style="display:none; max-height:0px; overflow:hidden;">Ref: ${Date.now().toString(36).toUpperCase()}</div>
                </div>
            </div>
        `;

        await sendEmail(email, autoReplySubject, autoReplyHtml);
        res.status(200).json({ message: 'Message Sent Successfully!' });

    } catch (error) {
        console.error("Error processing contact form:", error);
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
    console.log(`Gemini Chatbot: ${chatModel ? 'ACTIVE' : 'INACTIVE (Fallback Mode)'}`);
});
