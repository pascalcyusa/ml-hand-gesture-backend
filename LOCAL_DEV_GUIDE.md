# Local Development Guide

This guide will help you set up and run the project locally for development and testing.

---

## Prerequisites

- **Node.js** (v16 or higher recommended)
- **Bun** (for all frontend dependency and script management; see below)
- **Python** (v3.8 or higher)
- **pip** (Python package manager)
- **Docker** (optional, for running services in containers)

---

## 1. Clone the Repository

```
git clone <your-repo-url>
cd ml-hand-gesture
```

---

## Note on Docker

This project is compatible with the latest versions of Docker. If you are using Docker Desktop or Docker Engine 25.x or newer, all commands and compose files should work as expected. If you encounter issues, please refer to the official Docker documentation for troubleshooting.

---

## 2. Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. (Recommended) Create and activate a Python virtual environment:
   ```
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```
   uvicorn main:app --reload
   ```
   The backend should now be running at [http://localhost:8000](http://localhost:8000).

---

## 3. Frontend Setup (with Bun)

> **IMPORTANT:** This project uses **Bun** as its package manager and script runner for the frontend. **Never use npm, npx, or yarn.**

1. Open a new terminal and navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   bun install
   ```
3. Start the frontend development server:
   ```
   bun run dev
   ```
   The frontend should now be running at [http://localhost:5173](http://localhost:5173) (or as indicated in the terminal).

### Other common Bun commands

- **Build for production:**
  ```
  bun run build
  ```
- **Add a dependency:**
  ```
  bun add <package-name>
  ```
- **Add a dev dependency:**
  ```
  bun add -d <package-name>
  ```
- **Run arbitrary scripts:**
  ```
  bun run <script-name>
  ```

---

## 4. Using Docker (Optional)

If you prefer to use Docker for both frontend and backend:

1. From the project root, run:
   ```
   docker compose up --build
   ```
   (Note: The space in `docker compose` is intentional and recommended for newer Docker versions.)
2. This will start all services as defined in `docker-compose.yml`.

---

## 5. Common Issues

- Ensure ports 8000 (backend) and 5173 (frontend) are free.
- If you change backend code, restart the backend server.
- For environment variables, check `.env` files or config files in each directory.

---

## 6. Additional Resources

- See `README.md` for more details.
- See `APP_GUIDE.md` for application usage instructions.

---

Happy coding!
