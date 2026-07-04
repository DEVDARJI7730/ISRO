# Installation & Deployment Guide

This guide details the steps to set up, run, and test the ISRO Grayscale IR Image Colorization and Enhancement platform.

## System Prerequisites

1. **Python 3.11+**: Check version using `python --version`.
2. **Node.js 18+**: Check version using `node --version`.
3. **C compiler tools**: Required for OpenCV wheel building, though `opencv-python-headless` wheel solves compilation issues.

---

## 1. Local Development Installation

### Step A: Configure Backend Server

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows command:
   .venv\Scripts\activate
   # Linux/MacOS command:
   source .venv/bin/activate
   ```
3. Install required packages (utilizes PyTorch CPU build to avoid massive CUDA downloads):
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables:
   ```bash
   cp ../.env.example .env
   ```
5. Spin up the FastAPI server locally:
   ```bash
   uvicorn app.main:app --reload
   ```
   * The API documentation will be available at `http://localhost:8000/docs`.

### Step B: Configure Frontend Web Client

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

---

## 2. Running in Docker Containers (Recommended for Production)

Docker is the simplest deployment target, handling all path mappings, reverse proxy headers, static folder storage, and dependencies.

1. Ensure Docker Desktop is installed and running.
2. In the root directory (where `docker-compose.yml` resides), configure environment parameters:
   ```bash
   cp .env.example .env
   ```
3. Boot the container environment:
   ```bash
   docker-compose up --build
   ```
4. Once completed, access the web client at `http://localhost`. All requests matching `/api/*` and `/static/*` will be reverse-proxied to the backend automatically via Nginx.

---

## 3. Database Selection

* **MongoDB Atlas mode**: Enter your connection string in the `MONGODB_URI` environment variable inside your `.env` configuration.
* **Standalone / Offline mode**: Leave the `MONGODB_URI` blank. The backend will automatically initialize a JSON database file (`local_db.json`) inside the backend directory, allowing accounts, processed metadata, and system logs to persist on the disk immediately without any internet connection.
