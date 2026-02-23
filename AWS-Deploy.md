# AWS Deployment Guide (`AWS-Deploy.md`)

This living document tracks the AWS infrastructure setup for the **ML Hand Gesture App**, serving as a "where did I leave off?" guide if you return to the project after a long break.

---

## 🏗 Architecture Overview

The application is fully deployed on AWS, using a modern separated architecture:
*   **Backend (API & DB):** Runs in Docker containers on a single EC2 instance.
*   **Frontend (React UI):** Hosted as static files in an S3 Bucket, served globally via CloudFront.
*   **CI/CD Pipeline:** Fully automated via GitHub Actions.

### Resource Map
*   **EC2 Instance:** Ubuntu Server running Docker (`backend` and `db` containers).
*   **S3 Bucket:** `ml-hand-gesture-app-frontend` (Stores built React assets).
*   **CloudFront Distribution (Frontend):** Serves HTTPS for the S3 bucket (`index.html` as root).
*   **CloudFront Distribution (Backend):** Serves HTTPS pointing to the EC2 IP.

---

## 🚀 How Code Gets Deployed (The CI/CD Flow)

All deployment is automated through GitHub Actions (`.github/workflows/deploy.yml`).

1.  **Write code locally** on your Mac.
2.  **Commit & Push** your changes:
    ```bash
    git push origin deployment-prep-aws-5827474666849277538
    ```
3.  **GitHub Actions Takes Over (Parallel Jobs):**
    *   **Frontend:** The runner installs Bun, builds the `dist/` folder, syncs to the S3 bucket (deleting old files), and forces a CloudFront Cache Invalidation so users see the update instantly.
    *   **Backend:** The runner SSHs into your EC2 server, runs `git pull` to fetch the new code, and runs `docker compose up -d --build --force-recreate backend` to restart the FastAPI API.

You **do not** need to manually touch AWS for everyday code updates.

---

## 🛠 Everyday Maintenance & Tasks

### Connecting to the EC2 Server
If you ever need to run manual commands (like database migrations), log in via SSH:
```bash
ssh -i "path/to/your-key.pem" ubuntu@54.163.195.146
```

### Viewing Production Logs
To see API errors or output, SSH into the EC2 server and run:
```bash
cd ~/ml-hand-gesture
docker compose -f docker-compose.prod.yml logs -f backend
```

### Running Database Migrations
If you make changes to `models.py` (like adding a new table or column), the changes won't apply to the production database automatically. After the code deploys, SSH into EC2 and run:
```bash
cd ~/ml-hand-gesture
docker compose -f docker-compose.prod.yml exec backend python add_public_columns.py
```
*(Note: Change the script name if you create a new migration script).*

### Viewing the Database (DBeaver)
You can view production data directly from your Mac using DBeaver:
1. Ensure ports are uncommented in your EC2's `docker-compose.prod.yml`.
2. Do **not** open port 5432 to the Internet in AWS Security Groups.
3. In DBeaver, create a connection to `localhost:5432` (`postgres`/`postgres`, `ml_hand_gesture_db`).
4. In the DBeaver **SSH tab**, configure it to tunnel through your EC2 IP using your `.pem` key.
5. Click connect. The view is live in real-time.

---

## 🔐 Secrets & Configurations

The following secrets are securely stored in **GitHub repo → Settings → Secrets → Actions**:

*   `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`: Allows GitHub to upload to S3 and invalidate CloudFront.
*   `S3_BUCKET_NAME`: `ml-hand-gesture-app-frontend`
*   `FRONTEND_CLOUDFRONT_ID`: The ID of your UI distribution.
*   `BACKEND_CLOUDFRONT_URL`: Passed into the Vite build as the API Base URL.
*   `EC2_HOST`: The raw IP address of your EC2 server.
*   `EC2_SSH_KEY`: The raw text contents of your `.pem` key file.

The backend `.env` file lives permanently on the EC2 server (`~/ml-hand-gesture/.env`). Its layout is defined in `docker-compose.prod.yml`.

---

## 📌 "Where am I currently at?" (Project Status)

**Current State (As of Feb 2026):**
*   The `deployment-prep-aws-5827474666849277538` branch is stable and deployed.
*   All major features from `main` (like mobile UI revamps, SendGrid email password resets, session persistence, and security hardening) have been successfully cherry-picked and integrated.
*   Database tables have been renamed successfully to `motor_configs` and `piano_sequences`.

**What feature to build next?** 
*   Simply check out the `deployment-prep...` branch locally.
*   Write your code, commit, and push! The pipeline will handle the rest.
