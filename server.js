const { GoogleGenerativeAI } = require("@google/generative-ai");
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
*   **Contact:** (201) 222-1116 | info@stbernadine.com

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
                maxOutputTokens: 250,
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

// --- BREVO EMAIL & PDF CONFIGURATION ---
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.EMAIL_PASS;

const generatePDF = (data, signatureBuffer) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        const logoPath = path.join(__dirname, 'asset/images/4d-logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 80 });
        }

        doc.font('Helvetica-Bold').fontSize(18).text('ST. BERNADINE', 150, 50);
        doc.fontSize(12).text('SCHOOL OF ALLIED HEALTH', 150, 75);
        doc.font('Helvetica').fontSize(10).text('591 Summit Ave Suite 410, Jersey City, NJ 07306', 150, 95);
        doc.text('Phone: +1 (201) 222-1116 | Email: info@stbernadine.com', 150, 110);
        doc.moveDown(3);

        // Title
        doc.rect(50, 140, 495, 30).fill('#003366');
        doc.fillColor('white').font('Helvetica-Bold').fontSize(14).text('STUDENT ENROLLMENT APPLICATION', 50, 148, { align: 'center', width: 495 });
        doc.fillColor('black').moveDown(2);

        let y = 190;
        if (data['Program']) {
            doc.font('Helvetica-Bold').fontSize(12).text(`Program Applied For: ${data['Program']}`, 50, y, { align: 'center' });
            y += 30;
        }

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

const sendEmail = async (to, subject, htmlContent, attachments) => {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { "name": "St. Bernadine System", "email": "system@stbernadine.com" };
    sendSmtpEmail.to = [{ "email": to, "name": "Admin" }];
    if (attachments) {
        sendSmtpEmail.attachment = attachments;
    }

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
        return data;
    } catch (error) {
        console.error("Brevo API Error:", error);
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
            content: pdfBuffer.toString('base64'),
            name: `Application_${data.firstName}_${data.lastName}.pdf`
        });

        // Handle File Uploads
        if (req.files) {
            req.files.forEach(file => {
                const fileContent = fs.readFileSync(file.path).toString('base64');
                attachments.push({
                    content: fileContent,
                    name: file.originalname
                });
                // Cleanup
                fs.unlinkSync(file.path);
            });
        }

        // Email Content
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px;">New Student Application Received</h2>
                <p><strong>Applicant:</strong> ${data.firstName} ${data.lastName}</p>
                <p><strong>Program:</strong> ${data.Program}</p>
                <p>See attached PDF for full details.</p>
            </div>
        `;

        await sendEmail(process.env.EMAIL_USER, `New Application: ${data.firstName} ${data.lastName}`, htmlContent, attachments);
        res.status(200).send('Application Submitted Successfully!');

    } catch (error) {
        console.error("Error processing application:", error);
        res.status(500).send('Error: ' + error.message);
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
    console.log(`Using Brevo API for emails`);
    console.log(`Gemini Chatbot: ${chatModel ? 'ACTIVE' : 'INACTIVE (Fallback Mode)'}`);
});
