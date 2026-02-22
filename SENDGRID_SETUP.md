# SendGrid Setup Guide for Hand Pose Trainer

This guide will walk you through setting up SendGrid as your email service provider for sending password reset emails.

## 1. Create a SendGrid Account

1.  Go to [https://signup.sendgrid.com/](https://signup.sendgrid.com/) and create a free account.
2.  Fill in the required information.
3.  Confirm your email address.

## 2. Verify a Sender Identity

SendGrid requires you to verify the email address (or domain) that your emails will be sent *from*.

1.  Log in to your SendGrid dashboard.
2.  Go to **Settings** > **Sender Authentication**.
3.  Click **"Verify a Single Sender"**.
4.  Fill in the form:
    -   **From Name:** Hand Pose Trainer (or your app name)
    -   **From Email Address:** The email you want users to see (e.g., `no-reply@yourdomain.com` or your personal Gmail if testing).
    -   **Reply To:** Same as above.
    -   Fill in your physical address (required by anti-spam laws).
5.  SendGrid will send a verification email to that address. Click the link in the email to verify.

## 3. Generate an API Key

This is the password your application will use to authenticate with SendGrid.

1.  In the SendGrid dashboard, go to **Settings** > **API Keys**.
2.  Click **"Create API Key"**.
3.  **Name:** `HandPoseBackend` (or anything you like).
4.  **Permissions:** Select **"Restricted Access"**.
    -   Scroll down to **Mail Send** and click the slider to give **"Full Access"**.
    -   (Alternatively, you can choose "Full Access" for the whole key, but restricted is safer).
5.  Click **"Create & View"**.
6.  **IMPORTANT:** Copy the API Key immediately (it starts with `SG.`). You will not be shown this key again.

## 4. Configure Environment Variables

Now you need to tell your backend to use these credentials.

### A. Local Development

Create or update the `.env` file in your `backend/` directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/dbname

# Email (SendGrid)
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.YOUR_COPIED_API_KEY_HERE
MAIL_FROM=your-verified-sender-email@example.com
MAIL_PORT=587
MAIL_SERVER=smtp.sendgrid.net

# Frontend URL (for the reset link)
FRONTEND_URL=http://localhost:5173
```

*Note: The `MAIL_USERNAME` for SendGrid is always the string `apikey`.*

### B. Google Cloud Run (Production)

If you are deploying to Google Cloud Run, update your service with the new variables:

```bash
gcloud run services update hand-pose-backend \
  --set-env-vars MAIL_USERNAME=apikey \
  --set-env-vars MAIL_PASSWORD=SG.YOUR_COPIED_API_KEY_HERE \
  --set-env-vars MAIL_FROM=your-verified-sender-email@example.com \
  --set-env-vars MAIL_PORT=587 \
  --set-env-vars MAIL_SERVER=smtp.sendgrid.net \
  --set-env-vars FRONTEND_URL=https://your-frontend-url.netlify.app
```

## 5. Testing

1.  Restart your backend server.
2.  Go to the frontend login screen.
3.  Click "Forgot Password".
4.  Enter an email address that exists in your database.
5.  Check that email inbox for the reset link!
