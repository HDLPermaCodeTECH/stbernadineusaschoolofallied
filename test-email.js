require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.hostinger.com",
    port: process.env.EMAIL_PORT || 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || "hdlpermacodetech@stbernadineschoolofallied.com",
        pass: process.env.EMAIL_PASS || "Nitro19960422!"
    }
});

async function main() {
    try {
        console.log("Sending email...");
        const info = await transporter.sendMail({
            from: `"St. Bernadine System" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "Test Email Admin",
            text: "Hello, this is a test email sent from Node.js"
        });
        console.log("Message sent: %s", info.messageId);
    } catch (e) {
        console.error("Error sending email:", e);
    }
}
main();
