@echo off
setlocal EnableDelayedExpansion

:main_menu
cls
echo ========================================
echo    Smart Booking System Manager
echo ========================================
echo.
echo Please select an option:
echo.
echo 1. Complete System Setup (First Time)
echo 2. Create Dummy Users Only
echo 3. Start Development Servers
echo 4. Start Complete System (with browser)
echo 5. Quick Start (minimal setup)
echo 6. Stop All Servers
echo 7. System Status Check
echo 8. Clean and Reset
echo 9. Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto setup_complete
if "%choice%"=="2" goto create_users
if "%choice%"=="3" goto start_dev
if "%choice%"=="4" goto start_complete
if "%choice%"=="5" goto quick_start
if "%choice%"=="6" goto stop_servers
if "%choice%"=="7" goto system_status
if "%choice%"=="8" goto clean_reset
if "%choice%"=="9" goto exit
goto main_menu

:setup_complete
cls
echo ========================================
echo Smart Booking System - Complete Setup
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    goto main_menu
)

echo Setting up virtual environment...
if not exist ".venv" (
    python -m venv .venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo.
echo Activating virtual environment and installing dependencies...
call .venv\Scripts\activate

echo Installing Django and dependencies...
pip install --upgrade pip
pip install django djangorestframework django-cors-headers pillow

echo.
echo Running database migrations...
python manage.py makemigrations
python manage.py migrate

echo.
echo Creating dummy users and sample data...
python manage.py create_dummy_users --skip-if-exists

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo The system includes:
echo - Complete user authentication system
echo - Services browsing and management
echo - Booking management system
echo - Real-time notifications
echo - User profiles and dashboard
echo.
echo Test Users Created:
echo - admin / admin123 (Administrator)
echo - customer1 / customer123 (Verified Customer)
echo - customer2 / customer123 (Unverified Customer)  
echo - provider1 / provider123 (Service Provider)
echo.
echo Press any key to return to menu...
pause >nul
goto main_menu

:create_users
cls
echo ========================================
echo Creating Dummy Users
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv" (
    echo Virtual environment not found. Please run Complete Setup first.
    pause
    goto main_menu
)

echo Creating dummy users for Smart Booking application...
.venv\Scripts\python.exe manage.py create_dummy_users --skip-if-exists

echo.
echo Done! You can now use the following credentials:
echo.
echo Superuser:
echo   Username: admin
echo   Password: admin123
echo.
echo Customer 1:
echo   Username: customer1  
echo   Password: customer123
echo.
echo Customer 2 (unverified):
echo   Username: customer2
echo   Password: customer123
echo.
echo Service Provider:
echo   Username: provider1
echo   Password: provider123
echo.
echo Press any key to return to menu...
pause >nul
goto main_menu

:start_dev
cls
echo ========================================
echo Starting Development Servers
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv" (
    echo Virtual environment not found. Please run Complete Setup first.
    pause
    goto main_menu
)

echo Starting Django backend on http://localhost:8000...
start "Django Backend" cmd /k ".venv\Scripts\python.exe manage.py runserver"

REM Wait a bit for Django to start
timeout /t 3 /nobreak > nul

echo Starting frontend on http://localhost:8080...
start "Frontend Server" cmd /k "cd frontend/accounts && python -m http.server 8080"

REM Wait a bit for frontend to start
timeout /t 2 /nobreak > nul

echo.
echo Development servers started!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:8080
echo.
echo To stop servers, use option 6 or close the command windows.
echo.
echo Press any key to return to menu...
pause >nul
goto main_menu

:start_complete
cls
echo ========================================
echo Starting Complete System
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv" (
    echo Virtual environment not found. Please run Complete Setup first.
    pause
    goto main_menu
)

echo Starting Django backend server...
start "Django Backend" cmd /k ".venv\Scripts\activate && python manage.py runserver 8000"

REM Wait a moment for Django to start
timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend\accounts && python -m http.server 8080"

echo.
echo ==========================================
echo Smart Booking System is starting up...
echo ==========================================
echo.
echo Backend API: http://127.0.0.1:8000
echo Frontend:    http://127.0.0.1:8080
echo.
echo Features Available:
echo - User Authentication (Login/Register)
echo - Dashboard with Statistics
echo - Services Browsing and Management
echo - Bookings Management
echo - Notifications System
echo - User Profiles
echo.
echo Test Users:
echo - admin / admin123 (Admin)
echo - customer1 / customer123 (Customer)
echo - provider1 / provider123 (Provider)
echo.
echo Opening frontend in your browser...
timeout /t 2 /nobreak >nul

REM Open frontend in default browser
start http://127.0.0.1:8080

echo.
echo System is running! Use option 6 to stop servers.
echo Press any key to return to menu...
pause >nul
goto main_menu

:quick_start
cls
echo ========================================
echo Quick Start (Minimal Setup)
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate
    pip install django djangorestframework django-cors-headers pillow
    python manage.py migrate
) else (
    echo Virtual environment exists, activating...
    call .venv\Scripts\activate
)

echo Starting servers...
start "Django Backend" cmd /k "python manage.py runserver 8000"
timeout /t 2 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend\accounts && python -m http.server 8080"

echo.
echo Quick start complete!
echo Backend: http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:8080
echo.
echo Press any key to return to menu...
pause >nul
goto main_menu

:stop_servers
cls
echo ========================================
echo Stopping All Servers
echo ========================================
echo.

echo Stopping Django servers...
taskkill /f /im python.exe 2>nul
if %errorlevel%==0 (
    echo Django servers stopped.
) else (
    echo No Django servers were running.
)

echo.
echo All servers stopped.
echo Press any key to return to menu...
pause >nul
goto main_menu

:system_status
cls
echo ========================================
echo System Status Check
echo ========================================
echo.

echo Checking Python installation...
python --version 2>nul
if %errorlevel%==0 (
    echo ✓ Python is installed
) else (
    echo ✗ Python is not installed or not in PATH
)

echo.
echo Checking virtual environment...
if exist ".venv" (
    echo ✓ Virtual environment exists
    if exist ".venv\Scripts\python.exe" (
        echo ✓ Virtual environment is properly configured
    ) else (
        echo ✗ Virtual environment is corrupted
    )
) else (
    echo ✗ Virtual environment not found
)

echo.
echo Checking database...
if exist "db.sqlite3" (
    echo ✓ Database file exists
) else (
    echo ✗ Database file not found
)

echo.
echo Checking frontend files...
if exist "frontend\accounts\index.html" (
    echo ✓ Frontend files exist
) else (
    echo ✗ Frontend files not found
)

echo.
echo Checking for running servers...
netstat -an | find "8000" >nul
if %errorlevel%==0 (
    echo ✓ Django server appears to be running on port 8000
) else (
    echo ✗ No Django server detected on port 8000
)

netstat -an | find "8080" >nul
if %errorlevel%==0 (
    echo ✓ Frontend server appears to be running on port 8080
) else (
    echo ✗ No frontend server detected on port 8080
)

echo.
echo Press any key to return to menu...
pause >nul
goto main_menu

:clean_reset
cls
echo ========================================
echo Clean and Reset System
echo ========================================
echo.
echo WARNING: This will delete all data and reset the system!
echo.
set /p confirm="Are you sure? (y/N): "
if /i not "%confirm%"=="y" goto main_menu

echo Stopping all servers...
taskkill /f /im python.exe 2>nul

echo Removing database...
if exist "db.sqlite3" del "db.sqlite3"

echo Removing migration files...
if exist "accounts\migrations\0*.py" del "accounts\migrations\0*.py"
if exist "services\migrations\0*.py" del "services\migrations\0*.py"
if exist "bookings\migrations\0*.py" del "bookings\migrations\0*.py"
if exist "notifications\migrations\0*.py" del "notifications\migrations\0*.py"

echo Removing virtual environment...
if exist ".venv" rmdir /s /q ".venv"

echo.
echo System has been reset. Run Complete Setup to start fresh.
echo Press any key to return to menu...
pause >nul
goto main_menu

:exit
cls
echo ========================================
echo Thank you for using Smart Booking System
echo ========================================
echo.
echo Stopping any running servers...
taskkill /f /im python.exe 2>nul

echo.
echo Goodbye!
timeout /t 2 /nobreak >nul
exit /b 0

:error
echo.
echo An error occurred. Please check the output above.
pause
goto main_menu 