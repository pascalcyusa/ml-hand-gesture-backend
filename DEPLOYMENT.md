# Deployment Guide

This guide covers how to deploy the **Hand Pose Trainer** application. The stack consists of:
- **Frontend:** React + Vite (deployed as static site)
- **Backend:** FastAPI (Python) (deployed as a Docker container)
- **Database:** PostgreSQL (managed service or container)

## Prerequisites

- [Docker](https://www.docker.com/) installed.
- [Git](https://git-scm.com/) installed.
- Accounts for your chosen providers (e.g., Netlify, Sevalla, AWS, Google Cloud).

---

## 1. Frontend Deployment (Netlify)

Netlify is excellent for static sites like this React app.

1.  **Push your code to GitHub/GitLab/Bitbucket.**
2.  **Log in to [Netlify](https://www.netlify.com/).**
3.  Click **"Add new site"** -> **"Import from existing project"**.
4.  Connect your Git provider and select this repository.
5.  **Build Settings:**
    -   **Build command:** `npm run build`
    -   **Publish directory:** `dist`
6.  **Environment Variables:**
    -   Click "Advanced" or go to "Site configuration" > "Environment variables" after creation.
    -   Add `VITE_API_URL` and set it to your deployed backend URL (e.g., `https://my-backend-app.sevalla.app` or `https://api.mydomain.com`).
    -   *Note: You can deploy the frontend first, but it won't work fully until the backend is up. You can come back and update this variable later.*
7.  **Deploy Site.**

---

## 2. Backend Deployment

We recommend using **Docker** to make the backend portable across Sevalla, AWS, and GCP.

### Preparation
1.  Navigate to the `backend` folder.
2.  Build the image locally to test:
    ```bash
    docker build -t hand-pose-backend .
    ```

### Option A: Sevalla (Container Hosting)

Sevalla allows you to deploy containers easily.

1.  **Create a PostgreSQL Database:**
    -   You can use a free Postgres provider like [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or [Render](https://render.com/).
    -   Get the **Connection String** (e.g., `postgresql://user:pass@host:5432/db`).
2.  **Deploy Container:**
    -   If Sevalla supports building from Git:
        -   Connect your repo.
        -   Set **Root Directory** to `backend`.
        -   Set **Dockerfile Path** to `Dockerfile`.
    -   If Sevalla requires a registry (like Docker Hub):
        -   Push your image to Docker Hub:
            ```bash
            docker tag hand-pose-backend yourusername/hand-pose-backend
            docker push yourusername/hand-pose-backend
            ```
        -   Deploy from that image name.
3.  **Environment Variables:**
    -   Set `DATABASE_URL`: The connection string from step 1.
    -   Set `SECRET_KEY`: A long random string for security.
    -   Set `ALLOWED_ORIGINS`: The URL of your frontend (e.g., `https://my-site.netlify.app`).

### Option B: AWS (App Runner)

AWS App Runner is the easiest way to run containers on AWS.

1.  **Push to ECR (Elastic Container Registry):**
    -   Create a repository in AWS ECR.
    -   Follow the "View push commands" in AWS console to login, build, tag, and push your image.
2.  **Create App Runner Service:**
    -   Go to App Runner console -> Create Service.
    -   Source: Container Registry. Select your image from ECR.
    -   Deployment settings: Automatic.
3.  **Configuration:**
    -   Port: `8000`.
    -   **Environment variables:**
        -   `DATABASE_URL`: Your RDS or external Postgres URL.
        -   `SECRET_KEY`: Random string.
        -   `ALLOWED_ORIGINS`: Your Netlify URL.
4.  **Create.** AWS handles load balancing and HTTPS.

### Option C: Google Cloud (Cloud Run)

Cloud Run is a serverless container platform.

1.  **Install Google Cloud SDK** and login (`gcloud auth login`).
2.  **Deploy:**
    ```bash
    cd backend
    gcloud run deploy hand-pose-backend --source .
    ```
    -   It will ask for region (e.g., `us-central1`).
    -   It will ask to allow unauthenticated invocations -> **Yes** (so your frontend can reach it).
3.  **Environment Variables:**
    -   Go to Cloud Run console -> Select service -> Edit & Deploy New Revision.
    -   Variables tab: Add `DATABASE_URL`, `SECRET_KEY`, `ALLOWED_ORIGINS`.
    -   Deploy.

---

## 3. Database Setup

Since the app requires PostgreSQL:

-   **Development:** Use the `docker-compose.yml` included in the repo to run a local DB.
-   **Production:** Use a managed service.
    -   **Supabase / Neon / Railway:** Offer generous free tiers for Postgres.
    -   **AWS RDS:** Robust but costs money (Free Tier available for 12 months).
    -   **Google Cloud SQL:** Robust, costs money.

**Important:** When getting your `DATABASE_URL`, ensure it starts with `postgresql://`. If it starts with `postgres://`, SQLAlchemy might complain. You can simply rename it to `postgresql://`.

---

## 4. Final Connection

1.  Once Backend is live, copy its URL (e.g., `https://hand-pose-backend-xyz.run.app`).
2.  Go back to **Netlify** (Frontend).
3.  Update the `VITE_API_URL` environment variable with this Backend URL.
4.  Trigger a new deployment/build on Netlify.
5.  Your app is now live and connected!
