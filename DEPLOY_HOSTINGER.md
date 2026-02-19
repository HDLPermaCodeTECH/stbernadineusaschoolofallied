# How to Deploy to Hostinger (with Node.js)

Since your website uses a **Node.js backend** (for emails, PDFs, and AI chat), you cannot just upload HTML files. You must use the **Hostinger Node.js Application** setup.

### Phase 1: Prepare Your Files (I have done this for you)
I have created a zip file named `st-bernadine-deploy.zip` in your project folder. This contains all the code you need.

### Phase 2: Hostinger Setup (hPanel)

1.  **Log in to Hostinger hPanel**
    *   Go to [hpanel.hostinger.com](https://hpanel.hostinger.com).
    *   Click on **Websites** -> **Manage** (next to your domain).

2.  **Create Node.js Application**
    *   Scroll down to the **Advanced** section (or search in the sidebar).
    *   Click **Setup Node.js App**.
    *   Click **Create New Application**.
    *   **Settings:**
        *   **Node.js Version:** Choose **18** or **20** (Recommended).
        *   **Application Mode:** **Production**.
        *   **Application Root:** `st-bernadine-app` (or just leave it as standard, usually it asks for a folder name). Let's say we name the folder `web-app`.
        *   **Application URL:** Leave as default (your domain).
        *   **Application Startup File:** `server.js` (Type this manually).
    *   Click **Create**.

3.  **Upload Files**
    *   Once created, the page will show you the "Application Root" setting.
    *   Click the **File Manager** button (or go to Files -> File Manager in the main menu).
    *   Navigate to the folder you specified (e.g., `web-app` or `public_html`).
        *   *Note: If you want the site to be at the main domain, ensure the Node.js app is linked to the root, but often it lives in a subfolder and is mapped.*
    *   **Delete any default files** created by Hostinger (like `app.js` or `index.php`).
    *   **Upload** the `st-bernadine-deploy.zip` file I created.
    *   Right-click the zip file -> **Extract**. Extract it into the current folder.
    *   Ensure `server.js` and `package.json` are in the root of your application folder.

4.  **Install Dependencies**
    *   Go back to the **Setup Node.js App** page in hPanel.
    *   You should see a button that says **NPM Install**. Click it.
    *   Wait for it to finish (it installs the libraries).

5.  **Environment Variables (.env)**
    *   For security, Hostinger might not read the `.env` file directly if you don't upload it, or it might be better to set them in the UI.
    *   However, since I included the `.env` in the zip, it should work.
    *   **Verify:** Check if `.env` exists in the File Manager.
    *   **Important Keys needed:**
        *   `GEMINI_API_KEY`
        *   `EMAIL_USER`
        *   `EMAIL_PASS` (this was mapped to `apiKey` in server.js code, double check this!).
        *   *Correction regarding `server.js`: It reads `process.env.EMAIL_PASS` for Brevo.*

6.  **Start the Server**
    *   On the **Setup Node.js App** page, click **Restart** (or Start).
    *   The Status should turn to **Running**.

7.  **Test**
    *   Go to your website URL.
    *   Test the Contact Form or Application Form.

### Troubleshooting
*   **500 Error?** Check the **Logs** tab in the Node.js Setup page.
*   **"App Not Started"?** Make sure the "Application Startup File" is exactly `server.js`.
