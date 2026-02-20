fetch('https://www.stbernadineschoolofallied.com/send-contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: "AI Assistant",
        email: "llagashebreydill1996@gmail.com",
        contact_number: "1234567890",
        subject: "Live Deployment Test",
        message: "This is a test from the AI assistant to confirm your Hostinger deployment is working."
    })
}).then(async res => {
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
}).catch(console.error);
