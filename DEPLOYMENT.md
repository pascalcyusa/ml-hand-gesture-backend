# Deployment Guide: AWS (Backend) & S3/CloudFront (Frontend)

This guide will walk you through deploying your full-stack application on AWS using the Free Tier where possible.

## Architecture Overview

*   **Frontend**: Hosted on **AWS S3** (storage) and served via **AWS CloudFront** (CDN) for HTTPS and global performance.
*   **Backend**: Hosted on an **AWS EC2** instance (Virtual Machine) running Docker.
*   **Database**: PostgreSQL running inside a Docker container on the same EC2 instance.
*   **HTTPS**: Both Frontend and Backend will use CloudFront to provide secure HTTPS endpoints.

---

## Prerequisites

1.  **AWS Account**: Create one at [aws.amazon.com](https://aws.amazon.com).
2.  **Git**: Installed on your local machine.
3.  **Node.js**: Installed on your local machine (to build the frontend).

---

## Step 1: Deploy Backend to AWS EC2

### 1. Launch an EC2 Instance
1.  Log in to the **AWS Console** and search for **EC2**.
2.  Click **Launch Instance**.
3.  **Name**: `HandGestureBackend`.
4.  **AMI**: Select **Ubuntu** (Ubuntu Server 24.04 LTS or 22.04 LTS is fine).
5.  **Instance Type**: Select **t2.micro** or **t3.micro** (Free Tier eligible).
6.  **Key Pair**: Create a new key pair (e.g., `my-key`), download the `.pem` file, and keep it safe!
7.  **Network Settings**:
    *   Check **Allow SSH traffic from** -> **My IP**.
    *   Check **Allow HTTP traffic from the internet**.
    *   Check **Allow HTTPS traffic from the internet**.
8.  Click **Launch Instance**.

### 2. Configure Security Group
1.  Go to your EC2 Dashboard and click on your running instance.
2.  Click the **Security** tab, then click the **Security Group** link (e.g., `sg-0123...`).
3.  Click **Edit inbound rules**.
4.  Add a rule:
    *   **Type**: Custom TCP
    *   **Port**: `8000`
    *   **Source**: `0.0.0.0/0` (Anywhere) — *This is for testing, we will lock it down later if you want.*
5.  Click **Save rules**.

### 3. Connect to your Instance
1.  Open your terminal.
2.  Move your key file to a safe folder (e.g., `~/.ssh/`).
3.  Set permissions: `chmod 400 path/to/my-key.pem`.
4.  Connect:
    ```bash
    ssh -i path/to/my-key.pem ubuntu@<YOUR_INSTANCE_PUBLIC_IP>
    ```
    *(Replace `<YOUR_INSTANCE_PUBLIC_IP>` with the Public IPv4 address from the EC2 console).*

### 4. Install Docker on EC2
Run these commands one by one on your EC2 terminal:

```bash
# Update packages
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to the docker group (so you don't need sudo)
sudo usermod -aG docker $USER
```
*Disconnect and reconnect (`exit` then `ssh ...`) for the group change to take effect.*

### 5. Deploy the Backend Code
On your EC2 terminal:

1.  **Clone your repository**:
    ```bash
    git clone <YOUR_GITHUB_REPO_URL> app
    cd app
    ```
    *(If your repo is private, you may need to use a Personal Access Token or SSH key).*

2.  **Start the Backend**:
    We will use the production configuration.
    ```bash
    # Set the allowed origin (we'll update this later with the real frontend URL)
    export ALLOWED_ORIGINS="*"

    # Run Docker Compose
    docker-compose -f docker-compose.prod.yml up -d --build
    ```

3.  **Verify**:
    Open your browser and visit `http://<YOUR_INSTANCE_PUBLIC_IP>:8000/health`. You should see `{"status":"ok"}`.

---

## Step 2: Set up HTTPS for Backend (CloudFront)

Browsers block "Mixed Content" (HTTPS frontend talking to HTTP backend). So we need CloudFront for the backend too.

1.  Go to **CloudFront** in AWS Console.
2.  Click **Create distribution**.
3.  **Origin domain**: Enter your EC2 Public DNS (e.g., `ec2-1-2-3-4.compute-1.amazonaws.com`).
    *   *Tip: You can find this in the EC2 console.*
    *   *Do NOT select from the dropdown if it's not there, just paste it.*
4.  **Protocol**: HTTP only (CloudFront -> EC2 will be HTTP).
5.  **HTTP Port**: `8000` (Important! Change from 80 to 8000).
6.  **Viewer protocol policy**: **Redirect HTTP to HTTPS**.
7.  **Allowed HTTP methods**: Select **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**. (Crucial for API).
8.  **Cache key and origin requests**:
    *   Select **Cache policy and origin request policy**.
    *   **Cache policy**: Select `CachingDisabled` (Since this is an API, we don't want caching).
    *   **Origin request policy**: Select `AllViewerExceptHostHeader` (or create one that forwards All Headers). **Important: This passes Authorization headers.**
9.  Click **Create distribution**.
10. Wait for deployment. Copy the **Distribution domain name** (e.g., `https://d1234.cloudfront.net`).
    *   **This is your Backend URL.**

---

## Step 3: Deploy Frontend to S3 & CloudFront

### 1. Build the Frontend
On your **local machine**:
1.  Create a `.env` file in `frontend/`:
    ```bash
    VITE_API_URL=https://<YOUR_BACKEND_CLOUDFRONT_URL>
    ```
    *(Replace with the URL from Step 2, e.g., `https://d1234.cloudfront.net`)*.
2.  Build the app:
    ```bash
    cd frontend
    npm install
    npm run build
    ```
    This creates a `dist` folder.

### 2. Create S3 Bucket
1.  Go to **S3** in AWS Console.
2.  Click **Create bucket**.
3.  **Bucket name**: Unique name (e.g., `my-hand-gesture-app-frontend`).
4.  **Block Public Access settings**: Keep "Block all public access" **CHECKED**. (We will use CloudFront OAC for security).
5.  Click **Create bucket**.

### 3. Upload Files
1.  Open the bucket.
2.  Click **Upload**.
3.  Drag and drop the **contents** of your `frontend/dist` folder (index.html, assets, etc.).
4.  Click **Upload**.

### 4. Create CloudFront for Frontend
1.  Go to **CloudFront**.
2.  Click **Create distribution**.
3.  **Origin domain**: Select your S3 bucket.
4.  **Origin access**: Select **Origin access control settings (recommended)**.
    *   Click **Create control setting** -> Create.
5.  **Viewer protocol policy**: Redirect HTTP to HTTPS.
6.  **Default root object**: `index.html`.
7.  Click **Create distribution**.

### 5. Update S3 Bucket Policy
1.  Once created, you will see a blue banner saying "The S3 bucket policy needs to be updated".
2.  Click **Copy policy**.
3.  Go to your S3 Bucket -> **Permissions** tab -> **Bucket policy** -> **Edit**.
4.  Paste the policy and **Save changes**.

### 6. Fix Routing (Single Page App)
CloudFront needs to redirect 404s to `index.html` so React Router works.
1.  Open your Frontend CloudFront distribution.
2.  Go to **Error pages** tab.
3.  Click **Create custom error response**.
4.  **HTTP error code**: `403` (S3 returns 403 for missing files with OAC).
5.  **Customize error response**: Yes.
6.  **Response page path**: `/index.html`.
7.  **HTTP Response code**: `200`.
8.  Click **Create**.
9.  Repeat for `404` error code just in case.

---

## Step 4: Final Connection

1.  Copy your **Frontend CloudFront URL** (e.g., `https://d5678.cloudfront.net`).
2.  SSH into your **EC2 Backend**.
3.  Update the CORS settings:
    ```bash
    export ALLOWED_ORIGINS="https://d5678.cloudfront.net"
    docker-compose -f docker-compose.prod.yml up -d
    ```
    *Note: To make this permanent, create a `.env` file on the server with `ALLOWED_ORIGINS=...`.*

## Troubleshooting

*   **Camera not working?** Ensure you are accessing the site via HTTPS.
*   **API Errors?** Check the Network tab in Developer Tools.
    *   If `403/CORS` error: Check `ALLOWED_ORIGINS` on backend.
    *   If `502 Bad Gateway`: Backend might be down or Security Group/Port mapping is wrong.
    *   Check backend logs: `docker-compose -f docker-compose.prod.yml logs -f`.
