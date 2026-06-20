# PowerShell Startup script for Antigravity Web Website Builder Platform
Clear-Host

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "                    ANTIGRAVITY WEB WEBSITE BUILDER                   " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Initializing project setup..." -ForegroundColor Yellow

# 1. Setup Python Virtual Environment
if (-not (Test-Path "venv")) {
    Write-Host "[1/5] Creating Python virtual environment (venv)..." -ForegroundColor Yellow
    python -m venv venv
    if (-not $?) {
        Write-Host "Error creating virtual environment. Ensure Python 3.x is installed." -ForegroundColor Red
        Exit
      }
} else {
    Write-Host "[1/5] Python virtual environment already exists." -ForegroundColor Green
}

# 2. Install Backend Dependencies
Write-Host "[2/5] Installing backend python dependencies..." -ForegroundColor Yellow
& ".\venv\Scripts\pip" install -r backend/requirements.txt
if (-not $?) {
    Write-Host "Failed to install backend packages." -ForegroundColor Red
    Exit
}
Write-Host "Backend dependencies installed successfully." -ForegroundColor Green

# 3. Create PostgreSQL Database
Write-Host "[3/5] Checking and creating PostgreSQL database..." -ForegroundColor Yellow
& ".\venv\Scripts\python" setup_db.py
if (-not $?) {
    Write-Host "Database creation failed. Ensure PostgreSQL service is running." -ForegroundColor Red
    Exit
}

# 4. Run Django Migrations & Seed Users
Write-Host "[4/5] Running Django database migrations..." -ForegroundColor Yellow
& ".\venv\Scripts\python" backend/manage.py migrate
if (-not $?) {
    Write-Host "Database migration failed." -ForegroundColor Red
    Exit
}

Write-Host "Seeding initial accounts (admin & user)..." -ForegroundColor Yellow
& ".\venv\Scripts\python" seed_users.py

# 5. Install Frontend Packages
Write-Host "[5/5] Checking frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "node_modules not found. Installing node packages (may take a minute)..." -ForegroundColor Yellow
    cd frontend
    npm install
    cd ..
} else {
    Write-Host "Node modules already installed." -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "                        SETUP COMPLETED SUCCESSFULLY                  " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Credentials for testing:" -ForegroundColor Green
Write-Host "  👑 Admin Dashboard:  Username: admin   Password: password123" -ForegroundColor Green
Write-Host "  👨‍💻 User Dashboard:   Username: user    Password: password123" -ForegroundColor Green
Write-Host ""
Write-Host "Launching servers..." -ForegroundColor Cyan
Write-Host "  - Django Backend on: http://localhost:8001" -ForegroundColor Cyan
Write-Host "  - React Frontend on: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Separate windows will open for each dev server. Keep them open." -ForegroundColor Yellow
Write-Host "Press Ctrl+C in this window to stop this script once servers are open." -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Green

# Start Django Backend Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Django Backend Server on Port 8001...' -ForegroundColor Cyan; cd backend; ..\venv\Scripts\python manage.py runserver 8001"

# Start Vite React Frontend Dev Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Vite React Frontend Server on Port 5173...' -ForegroundColor Cyan; cd frontend; npm run dev"
