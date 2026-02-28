# AGENTS.md

This document provides essential information for AI agents working in the `ml-hand-gesture` repository.

## 1. Project Overview

**ML Hand Gesture** is a full-stack web application designed for training and using machine learning models to control external devices (like piano notes and LEGO Spike Prime motors) via hand gestures detected by a webcam.

- **Frontend:** React with Vite, Bun, Tailwind CSS, ESLint. Machine learning models are trained and run client-side using `@mediapipe/tasks-vision` and `@tensorflow/tfjs`.
- **Backend:** FastAPI with SQLAlchemy, running on Python. Handles user authentication, database interactions, and potentially other API services.

## 2. Essential Commands

### 2.1. Local Development

**From the project root directory:**

*   **Run with Docker Compose (Recommended for full stack):**
    ```bash
    docker compose up --build
    ```
    (This will start both frontend and backend services.)

**Backend (`./backend` directory):**

*   **Install Python dependencies (with virtual environment):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
*   **Start Backend Server:**
    ```bash
    uvicorn main:app --reload
    ```
    (Runs on `http://localhost:8000`)

**Frontend (`./frontend` directory):**

*   **CRITICAL: Use Bun for all frontend tasks.** Never use `npm`, `npx`, or `yarn`.
*   **Install JavaScript dependencies:**
    ```bash
    bun install
    ```
*   **Start Frontend Development Server:**
    ```bash
    bun run dev
    ```
    (Typically runs on `http://localhost:5173`)
*   **Build for Production:**
    ```bash
    bun run build
    ```
*   **Run Linter:**
    ```bash
    bun run lint
    ```

### 2.2. Deployment

The project uses Google Cloud Build and Cloud Run for deployment. Refer to `cloudbuild.yaml` for the specific steps to build and deploy the backend Docker image.

## 3. Code Organization and Structure

### 3.1. Backend (`./backend`)

*   `main.py`: Main FastAPI application entry point. Defines API routes.
*   `models.py`: SQLAlchemy models for database schema definition.
*   `database.py`: Handles database connection, session management, and Alembic migrations.
*   `auth.py`: Logic for user authentication (JWT, password hashing).
*   `email_utils.py`: Utility functions for sending emails (e.g., password reset).
*   `add_public_columns.py`: A script likely used for database schema modifications or data seeding.
*   `requirements.txt`: Lists Python dependencies.
*   `Dockerfile`: Defines the Docker image for the backend.

### 3.2. Frontend (`./frontend/src`)

*   `App.jsx`: Main React application component.
*   `main.jsx`: React entry point.
*   `hooks/`: Custom React hooks encapsulating logic:
    *   `useSpikeDevice.js`: Manages connection and communication with LEGO Spike Prime devices.
    *   `useHandDetection.js`: Integrates MediaPipe for hand gesture detection.
    *   `useModelTrainer.js`: Handles in-browser ML model training.
    *   `usePredictionManager.js`: Manages ML model predictions.
    *   `useAuth.js`: Handles authentication state.
*   `components/`: Contains UI components, often organized by feature or domain:
    *   `Dashboard/`, `Training/`, `Piano/`, `Motors/`, `Devices/`, `Community/`, `About/`: Feature-specific components.
    *   `ui/`: Reusable UI primitives (e.g., `button.jsx`, `card.jsx`).
    *   `common/`: Common application-wide components (e.g., `AuthModal.jsx`, `Toast.jsx`).
    *   `Layout/`: Components for overall page layout (e.g., `Header.jsx`, `Footer.jsx`).
*   `lib/`, `utils/`: General utility functions and helpers.
    *   `mediapipe.js`: Helper for MediaPipe integration.
    *   `spikeProtocol.js`: Defines communication protocols for Spike device.
*   `theme/`: Contains CSS files for styling (e.g., `gruvbox.css`).
*   `tailwind.css`: Main Tailwind CSS import file.

## 4. Naming Conventions and Style Patterns

*   **Python:** Follows standard Python (PEP 8) conventions:
    *   `snake_case` for functions, variables, and module names.
    *   `PascalCase` for class names.
    *   Uses FastAPI decorators for API endpoints and Pydantic for data validation.
    *   SQLAlchemy models define database tables.
*   **JavaScript/React:**
    *   `PascalCase` for React component names (e.g., `MyComponent.jsx`).
    *   `camelCase` for JavaScript variables and functions.
    *   Functional components are preferred, leveraging React Hooks.
    *   Styling is primarily handled using [Tailwind CSS](https://tailwindcss.com/) and occasionally inline CSS modules.
    *   Linting is enforced by ESLint, configured in `eslint.config.js`.

## 5. Testing Approach

No explicit test runner configurations or test scripts were found in `package.json` or `requirements.txt`. Therefore, automated testing is not explicitly set up or enforced in this repository. If tests need to be added, establish a testing framework (e.g., Pytest for Python, Vitest/Jest for JavaScript) and define test scripts.

## 6. Important Gotchas and Non-Obvious Patterns

*   **Frontend Package Manager:** Always use `bun` (`bun install`, `bun run <script>`). Do not use `npm` or `yarn`.
*   **Environment Variables:** Both frontend and backend rely on environment variables, often loaded from `.env` files. Ensure these are correctly configured for local development and deployment. Refer to `LOCAL_DEV_GUIDE.md` and `SENDGRID_SETUP.md`.
*   **Client-Side ML:** All machine learning training and inference occurs directly in the browser, ensuring user privacy. No camera data leaves the device.
*   **Web Serial/Bluetooth:** The frontend interacts with external hardware (LEGO Spike Prime) using Web Serial and Web Bluetooth APIs, primarily managed by the `useSpikeDevice` hook. Browser permissions will be required for these features.
*   **Port Numbers:** Backend runs on port `8000`, frontend development server typically runs on `5173`. Avoid conflicts.
*   **Code Generation/Build Process:** The frontend uses Vite, which handles its own build process. No special code generation steps were identified for the backend beyond standard Python package management.
