---
description: Run the Full Stack Application (Backend + Frontend)
---

This workflow helps you run the application even if your C: drive is full, by ensuring temporary files and caches use the D: drive.

## Prerequisites
- D: drive has available space.
- Python and Node.js are installed.

## 1. Setup Environment on D: (Bypass C: Full Issues)
Create temporary directories on D: to avoid "No space left on device" errors.

```powershell
# Create directories
New-Item -ItemType Directory -Force -Path "D:\temp"
New-Item -ItemType Directory -Force -Path "D:\npm-cache"

# Set environment variables for this session
$env:TEMP = "D:\temp"
$env:TMP = "D:\temp"
$env:npm_config_cache = "D:\npm-cache"
```

## 2. Start the Backend Server
The backend is a FastAPI app running on port 5000.

```powershell
# Activate Virtual Environment
.\venv\Scripts\activate

# Run the server
python run.py
```
*Wait for "Uvicorn running on http://localhost:5000" or similar.*

## 3. Start the Frontend Application
Open a **new terminal** (so the backend keeps running) and run the frontend.

```powershell
# Set environment variables for this new terminal session as well
$env:TEMP = "D:\temp"
$env:TMP = "D:\temp"
$env:npm_config_cache = "D:\npm-cache"

# Start Vite Dev Server
npm run dev
```
*Access the app at http://localhost:5173 (or the port shown).*
