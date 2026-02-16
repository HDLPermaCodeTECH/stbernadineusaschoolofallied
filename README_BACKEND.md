# How to Run the Nodemailer Backend

You requested to use **Nodemailer** instead of FormSubmit.co.
To make this work, you must install a "Server Engine" (Node.js) on your computer.

### Step 1: Install Node.js
1.  Go to: [https://nodejs.org/](https://nodejs.org/)
2.  Download the **LTS Version** (Recommended for Most Users).
3.  Install it (click Next, Next, Finish).
4.  **Restart your computer** (Important!).

### Step 2: Install Dependencies
1.  Open VS Code Terminal.
2.  Type this command and press Enter:
    ```bash
    npm install
    ```
    (This will download the tools listed in `package.json`).

### Step 3: Configure Your Password
1.  Open the file `server.js`.
2.  Look for line 32: `pass: 'INSERT_YOUR_16_CHAR_APP_PASSWORD_HERE'`
3.  Replace that text with your actual **Gmail App Password**.
    *   (Note: Your normal Gmail password will NOT work. You must generate an App Password in your Google Account settings).

### Step 4: Run the Server
1.  In the terminal, type:
    ```bash
    node server.js
    ```
2.  You should see: `Server running at http://localhost:3000`

### Step 5: Test
1.  Open your browser to `http://localhost:3000/apply.html`
2.  Submit the form.
3.  Check your terminal for "Email sent" confirmation.

---
**WARNING:** This backend only works on your **LOCAL COMPUTER**.
If you push this to GitHub Pages, the form **WILL NOT WORK** because GitHub Pages does not support Node.js servers.
To make it work online, you must deploy this `server.js` to a real host like **Render**, **Heroku**, or **DigitalOcean**.
