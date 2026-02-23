# Deployment Guide (`DEPLOYMENT_GCP_NETLIFY.md`)

This living document tracks the managed cloud infrastructure setup for the **ML Hand Gesture App**, serving as a "where did I leave off?" guide if you return to the project after a long break.

---

## 🏗 Architecture Overview (Main Branch)

The application is fully deployed across managed, serverless cloud platforms for ease of use and zero-maintenance scaling:
*   **Backend (FastAPI API):** Containerized and deployed to **Google Cloud Run**.
*   **Database (PostgreSQL):** Hosted on **Neon Serverless Postgres**.
*   **Frontend (React UI):** Hosted globally via **Netlify**.
*   **Email Services:** Powered by **SendGrid**.

### Resource Map
*   **Google Cloud:** Project `ml-hand-gesture` running the Cloud Run service (`ml-hand-gesture-backend`).
*   **Neon:** Project `ml-hand-gesture-db` providing the `DATABASE_URL`.
*   **Netlify:** Site `ml-hand-gesture-app` connecting directly to GitHub.
*   **SendGrid:** Authorized sender providing the `SENDGRID_API_KEY`.

---

## 🚀 How Code Gets Deployed (The CI/CD Flow)

### Frontend (Netlify)
Netlify connects directly to this repository's `main` branch. 
1.  **Write code locally.**
2.  **Commit & Push** your changes to `main`.
3.  **Netlify Takes Over:** It detects the push, automatically runs `npm run build` (or `bun run build`), and deploys the `dist/` folder globally in seconds.

### Backend (Google Cloud Run)
Google Cloud Build is configured to watch your repository using the `cloudbuild.yaml` file.
1.  **Write code locally.**
2.  **Commit & Push** your changes to `main`.
3.  **Cloud Build Takes Over:** It reads `cloudbuild.yaml`, builds your Docker image (`backend/Dockerfile`), pushes it to Google Artifact Registry, and deploys the new revision to Cloud Run.

You **do not** need to manually touch servers or run scripts for everyday code updates. Everything auto-deploys on `git push`.

---

## 🛠 Everyday Maintenance & Tasks

### Managing the Database (Neon)
Because you use Neon, you don't need SSH tunnels or terminal commands!
1. Go to **console.neon.tech** and log in.
2. Under your Project, navigate to **SQL Editor** or **Tables**.
3. You can visually inspect all data, write queries, and edit records straight from the browser.

**(Optional) Using DBeaver:**
If you prefer a desktop app, you can connect DBeaver using the exact same `DATABASE_URL` you put in your `.env`. No SSH tunneling required—just standard host, username, and password.

### Viewing Production Logs (Backend)
If the API is throwing errors, you check the logs in Google Cloud:
1. Go to **console.cloud.google.com**.
2. Search for **Cloud Run**.
3. Click your service (`ml-hand-gesture-backend`).
4. Click the **Logs** tab. You'll see real-time output of every request and Python tracebacks.

### Running Database Migrations
If you make changes to `models.py` (like adding a table/column), you need to update the Neon database. Since Cloud Run doesn't have a persistent shell, you run the migration script **locally** on your Mac pointing to the production database:
1. Make sure your local `.env` has the Neon `DATABASE_URL`.
2. Run your migration scripts locally:
   ```bash
   cd backend
   python add_public_columns.py # or whatever your new script is
   ```
   *(This connects to Neon and updates the schema securely over the internet).*

---

## 🔐 Secrets & Configurations

### 1. Frontend (Netlify Environment Variables)
Location: Netlify Dashboard → Site configuration → Environment variables
*   `VITE_API_URL`: Your Google Cloud Run URL (e.g., `https://ml-hand-gesture-backend-xxxxxxxxxx-ue.a.run.app`)

### 2. Backend (Google Cloud Secret Manager / Cloud Run Variables)
Location: Google Cloud Console → Cloud Run → Service → Edit & Deploy New Revision → Variables & Secrets
*   `DATABASE_URL`: Your Neon connection string.
*   `JWT_SECRET`: The strong, random string used for session tokens.
*   `ALLOWED_ORIGINS`: Your Netlify URL (e.g., `https://your-site.netlify.app`).
*   `SENDGRID_API_KEY`: The key from your SendGrid dashboard.
*   `SENDGRID_FROM_EMAIL`: The verified sender email address.

*(Note: During CI/CD, Cloud Build pulls these secrets automatically and maps them to the container.)*

---

## 📌 "Where am I currently at?" (Project Status)

**Current State (As of Feb 2026):**
*   The `main` branch is the source of truth, packed with the newest features.
*   **Netlify** handles the frontend effortlessly.
*   **Cloud Run** scales the backend automatically from zero to handle any traffic.
*   **Neon** provides zero-maintenance, serverless Postgres.
*   **SendGrid** handles "Forgot Password" emails flawlessly.

**What to do next?** 
*   Simply stay on `main`. 
*   Write code, commit, and `git push origin main`.
*   Both Netlify and Google Cloud Run will automatically build and deploy your changes.
