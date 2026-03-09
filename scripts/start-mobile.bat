@echo off
REM LAN-ONLY STARTUP – No tunnel, no ngrok. Phone and PC on same Wi-Fi.
REM MARCH 2026: Tunnel mode removed per user request.

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   LAN-ONLY MOBILE STARTUP (No tunnel / No ngrok)
echo ============================================================
echo.

set BACKEND_PATH=..\..\DeliveryAppBackend
set MOBILE_PATH=.

REM Step 1: Check if Django backend is already running
echo Checking Django backend...
curl -s http://localhost:8000/api/health/ >nul 2>&1
if %errorlevel% equ 0 (
    echo Django backend already running.
) else (
    echo Starting Django backend...
    pushd "%BACKEND_PATH%"
    if exist "venv\Scripts\activate.bat" (call venv\Scripts\activate.bat) else if exist ".venv\Scripts\activate.bat" (call .venv\Scripts\activate.bat)
    start /B python manage.py runserver 0.0.0.0:8000
    echo Waiting for Django...
    for /L %%i in (1,1,30) do (
        curl -s http://localhost:8000/api/health/ >nul 2>&1
        if !errorlevel! equ 0 (echo Django ready. & goto django_ready)
        timeout /t 2 >nul
    )
    echo Django failed to start. & exit /b 1
:django_ready
    popd
)

REM Step 2: Detect local IP for LAN
echo Detecting local IP...
set LOCAL_IP=
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr /v "127.0.0.1" ^| findstr /v "169.254"') do (set "LOCAL_IP=%%i" & goto ip_done)
:ip_done
set LOCAL_IP=%LOCAL_IP: =%
if "%LOCAL_IP%"=="" set LOCAL_IP=192.168.1.80
echo Local IP: %LOCAL_IP%

REM Step 3: Write .env (LAN only)
echo # LAN-only > .env
echo BACKEND_URL=http://%LOCAL_IP%:8000/api >> .env
echo .env updated with BACKEND_URL=http://%LOCAL_IP%:8000/api

REM Step 4: Start Expo (LAN only – no tunnel)
echo Starting Expo (LAN only)...
start /B npx @expo/cli start --clear --port 8081

echo.
echo ============================================================
echo   LAN-ONLY STARTUP COMPLETE
echo ============================================================
echo   Backend:  http://%LOCAL_IP%:8000/api
echo   Expo:     Scan QR – phone must be on same Wi-Fi
echo   No tunnel – no ngrok
echo ============================================================
echo.
pause >nul
