# Google Cloud + Netlify Deployment Guide

This guide details how to deploy your full-stack application using **Google Cloud Run** for the backend (FastAPI) and **Netlify** for the frontend (React). This architecture is scalable, cost-effective, and robust.

## Prerequisites

1.  **Google Cloud Platform (GCP) Account:** Ensure you have a project created and billing enabled.
2.  **Netlify Account:** For hosting the frontend.
3.  **Google Cloud SDK (gcloud CLI):** [Installed and initialized](https://cloud.google.com/sdk/docs/install).
4.  **Docker:** [Installed](https://www.docker.com/get-started) for building images locally.
5.  **Git:** Installed.

---

## Part 1: Database Setup (PostgreSQL)

Since Google Cloud Run is **stateless** (containers can be restarted anytime, losing local data), you **cannot** run a persistent database *inside* the same container. You must use an external database service.

### Option A: Use a Free Managed Database (Recommended)
Services like **Neon**, **Supabase**, or **CockroachDB Serverless** offer excellent free tiers for PostgreSQL.

1.  **Sign up** for [Neon](https://neon.tech/) or [Supabase](https://supabase.com/).
2.  **Create a new project.**
3.  **Get the Connection String:** Look for a URL like:
    ```
    postgresql://user:password@ep-shiny-hill-123456.us-east-2.aws.neon.tech/neondb
    ```
    *(Note: If it starts with `postgres://`, change it to `postgresql://` for Python compatibility.)*

### Option B: Google Cloud SQL (Paid)
GCP offers a managed Cloud SQL service, but it can be expensive (~$10-50/mo minimum).

1.  Go to the **Cloud SQL** section in GCP Console.
2.  **Create Instance** -> Choose **PostgreSQL**.
3.  Set a password for the `postgres` user.
4.  Once created, note the **Connection Name** and **Public IP**.

---

## Part 2: Backend Deployment (Google Cloud Run)

We will containerize the FastAPI backend and deploy it to Cloud Run.

### 1. Enable Required APIs
Run these commands in your terminal:
```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Configure & Deploy
Navigate to the root of your project in the terminal.

1.  **Submit the Build to Cloud Build:**
    This builds your Docker image in the cloud and stores it in Google Container Registry (GCR).
    ```bash
    cd backend
    gcloud builds submit --tag gcr.io/ml-hand-gesture/hand-pose-backend
    ```

2.  **Deploy to Cloud Run:**
    ```bash
    gcloud run deploy hand-pose-backend \
      --image gcr.io/ml-hand-gesture/hand-pose-backend \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars "DATABASE_URL=YOUR_DB_CONNECTION_STRING" \
      --set-env-vars "SECRET_KEY=CHANGE_THIS_TO_RANDOM_STRING" \
      --set-env-vars "ALLOWED_ORIGINS=https://YOUR-NETLIFY-SITE.netlify.app"
    ```
    -   `--allow-unauthenticated`: Makes the API public so your frontend can reach it.
    -   `ALLOWED_ORIGINS`: You might not know your Netlify URL yet. You can set it to `*` temporarily or update it later.

3.  **Get the Backend URL:**
    Once deployed, the command will output a Service URL (e.g., `https://hand-pose-backend-xyz123.a.run.app`). **Copy this URL.**

---

## Part 3: Frontend Deployment (Netlify)

Now we deploy the React frontend and connect it to your running backend.

1.  **Push your code to GitHub/GitLab.**
2.  **Log in to [Netlify](https://app.netlify.com/).**
3.  **"Add new site"** -> **"Import from existing project"**.
4.  Connect your Git provider and select this repository.
5.  **Build Settings:**
    -   **Base directory:** `frontend` (Important!)
    -   **Build command:** `npm run build`
    -   **Publish directory:** `dist`
6.  **Environment Variables:**
    -   Click **"Show advanced"** or go to "Site configuration" > "Environment variables" after creation.
    -   Add a variable:
        -   **Key:** `VITE_API_URL`
        -   **Value:** Your Google Cloud Run URL (e.g., `https://hand-pose-backend-xyz123.a.run.app`)
            *(Do not add a trailing slash `/`)*
7.  **Deploy Site.**

---

## Part 4: Final Configuration

1.  **Update Backend CORS (Crucial):**
    Once your Netlify site is live (e.g., `https://wonderful-site-123.netlify.app`), go back to Google Cloud Run:
    -   Go to the **Cloud Run** console -> Click your service (`hand-pose-backend`).
    -   Click **"Edit & Deploy New Revision"**.
    -   Go to the **"Variables & Secrets"** tab.
    -   Update `ALLOWED_ORIGINS` to match your *exact* Netlify URL (no trailing slash).
        -   Example: `https://wonderful-site-123.netlify.app`
    -   Click **Deploy**.

2.  **Test the App:**
    Open your Netlify URL. The frontend should load, and network requests (Inspect -> Network) should successfully hit your Google Cloud Run backend.

---

## Troubleshooting

-   **CORS Errors:** Check the Browser Console. If you see "CORS error", verify that the `ALLOWED_ORIGINS` env var on Cloud Run matches the URL in your browser address bar exactly.
-   **Database Connection Fail:** Check Cloud Run logs (Logs tab). Ensure your database connection string is correct and starts with `postgresql://`. If using Cloud SQL, ensure your instance has a Public IP or you are using the Cloud SQL Auth Proxy (the external provider option like Neon is often simpler for starters).
-   **500 Errors:** Check Cloud Run logs. It usually means an unhandled exception in the Python code or a database issue.
