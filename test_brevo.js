require('dotenv').config();
const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.EMAIL_PASS;

console.log("Testing Brevo API...");
console.log("API Key found: ", process.env.EMAIL_PASS ? "Yes (starts with " + process.env.EMAIL_PASS.substring(0, 5) + ")" : "No");

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

sendSmtpEmail.subject = "Test Email from Debug Script";
sendSmtpEmail.htmlContent = "<html><body><h1>This is a test</h1><p>Checking credentials.</p></body></html>";
sendSmtpEmail.sender = { "name": "St. Bernadine System", "email": process.env.EMAIL_USER };
sendSmtpEmail.to = [{ "email": "hdlpermacodetech@stbernadineschoolofallied.com", "name": "Admin" }];

apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
    console.log('API called successfully. Returned data: ' + JSON.stringify(data));
}, function (error) {
    console.error("Brevo API Error:");
    if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Text:", error.response.text);
    } else {
        console.error(error);
    }
});
