# Deployment Guide

This guide covers how to deploy the **ML Hand Gesture** application.
The architecture consists of:
1.  **Frontend**: React app (hosted on Netlify).
2.  **Backend**: FastAPI app with Postgres (hosted on Sevalla, AWS, or GCP).

---

## Prerequisites
- **Git** installed and project committed to GitHub/GitLab.
- **Docker** installed (for testing locally).
- Accounts on the respective cloud providers.

## 🛡️ Security Checklist (Critical)

Before deploying, generate a strong secret key for your backend.
Run this in your terminal:
```bash
openssl rand -hex 32
```
Save this output. You will need it for the `JWT_SECRET_KEY` environment variable.

---

## Part 1: Backend Deployment

Choose ONE of the following options. **Sevalla** is recommended for the easiest setup with a free tier.

### Option A: Sevalla (Recommended)

1.  **Sign Up/Login** to [Sevalla](https://sevalla.com/).
2.  **Create a Database**:
    - Go to **Databases** -> **Create Database**.
    - Choose **PostgreSQL**.
    - Select a region.
    - **Save the Connection String** (e.g., `postgresql://user:pass@host:5432/db`).
3.  **Deploy Backend**:
    - Go to **Applications** -> **Create Application**.
    - Connect your Git repository.
    - Select the `backend` folder as the **Root Directory** (Important!).
    - Sevalla should auto-detect the `Dockerfile` in `backend`.
    - **Environment Variables**: Add the following:
        - `DATABASE_URL`: *(Paste the connection string from step 2)*
        - `JWT_SECRET_KEY`: *(Paste the string generated in Security Checklist)*
        - `ALLOWED_ORIGINS`: `https://YOUR-NETLIFY-SITE.netlify.app` *(You can add this later after deploying frontend)*
    - Click **Deploy**.
4.  **Get Backend URL**: Once deployed, copy the provided domain (e.g., `https://backend-xyz.sevalla.app`).

### Option B: Google Cloud Platform (Cloud Run)

1.  **Install gcloud CLI** and login: `gcloud auth login`.
2.  **Create a Postgres Instance** (Cloud SQL) or use a free managed Postgres service like Neon.tech or Supabase (easier for testing).
    - If using **Neon/Supabase**, get the `DATABASE_URL`.
3.  **Deploy to Cloud Run**:
    ```bash
    cd backend
    gcloud run deploy ml-hand-gesture-backend --source . --allow-unauthenticated
    ```
    - Follow the prompts.
    - When asked for environment variables, set:
      - `DATABASE_URL`
      - `JWT_SECRET_KEY`
4.  **Get Backend URL**: The command will output a URL (e.g., `https://ml-hand-gesture-backend-xyz-uc.a.run.app`).

### Option C: AWS (App Runner)

1.  **Push Image to ECR** (Elastic Container Registry) OR connect GitHub directly to App Runner.
2.  **Go to AWS Console -> App Runner**.
3.  **Create Service**:
    - Source: **Source Code Repository** -> Connect GitHub -> Select Repo -> Directory `backend`.
    - **Runtime**: Python 3.
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8080`
    - **Port**: 8080
4.  **Environment Variables**:
    - Add `DATABASE_URL`.
    - Add `JWT_SECRET_KEY`.
    - Add `ALLOWED_ORIGINS`.

---

## Part 2: Frontend Deployment (Netlify)

1.  **Sign Up/Login** to [Netlify](https://www.netlify.com/).
2.  **Add New Site** -> **Import from Git**.
3.  **Configure Build**:
    - **Base directory**: `frontend`
    - **Build command**: `npm run build`
    - **Publish directory**: `dist`
4.  **Environment Variables**:
    - Click **"Show advanced"** or go to **Site Settings -> Environment variables** after import.
    - Key: `VITE_API_URL`
    - Value: *(The Backend URL from Part 1, e.g., `https://backend-xyz.sevalla.app`)* -> **IMPORTANT**: No trailing slash.
5.  **Deploy Site**.

---

## Final Configuration

1.  **Update Backend CORS**:
    - Go back to your Backend hosting dashboard (Sevalla/AWS/GCP).
    - Update the `ALLOWED_ORIGINS` environment variable to include your new Netlify URL (e.g., `https://my-app.netlify.app`).
    - Redeploy the backend if necessary.
2.  **Test**: Open your Netlify app. It should now connect to your hosted backend.
