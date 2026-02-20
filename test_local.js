fetch('http://localhost:3000/send-contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: "AI Assistant",
        email: "llagashebreydill1996@gmail.com",
        contact_number: "1234567890",
        subject: "Local Deployment Test",
        message: "This is a test from the AI assistant to confirm your Nodemailer deployment is working locally."
    })
}).then(async res => {
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
}).catch(console.error);
