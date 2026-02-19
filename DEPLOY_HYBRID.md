# How to Deploy (Hybrid Mode)

Since we are using **Hostinger Premium** (Frontend) + **Render** (Backend), follow these steps:

### Part 1: Backend (Render)
1.  **Create a GitHub Repository** for your server code.
    - Upload `server.js`, `package.json`, `.env`, and `asset/images/logo.png` (for PDF) to a GitHub repo.
    - *Alternatively, I can help you deploy if you give me access, but manual is safer.*
2.  **Go to Render.com** -> New **Web Service**.
3.  Connect your GitHub repo.
4.  **Settings:**
    - **Build Command:** `npm install`
    - **Start Command:** `node server.js`
    - **Environment Variables:** Add `EMAIL_USER`, `EMAIL_PASS`, `GEMINI_API_KEY`.
5.  **Copy the Render URL** (e.g., `https://stbernadineusaschoolofallied.onrender.com`).
    - *Note: I have already updated your HTML files to use this URL!*

### Part 2: Frontend (Hostinger)
1.  **Log in to Hostinger hPanel.**
2.  **Go to File Manager** for your domain.
3.  **Upload the `st-bernadine-frontend.zip`** (I will create this for you next).
    - This zip contains *only* the HTML, CSS, JS, and Assets.
    - It does *not* contain the server code (since Hostinger can't run it).
4.  **Extract** the zip file in `public_html`.

### Verification
1.  Open your website (e.g., `stbernadineschoolofallied.com`).
2.  Go to **Contact Us** and send a message.
3.  If it says "Message Sent Successfully", then Hostinger is talking to Render correctly!
