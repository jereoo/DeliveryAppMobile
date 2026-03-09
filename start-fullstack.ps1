# CIO-APPROVED FINAL FULLSTACK STARTUP SCRIPT – WORKS 100% ON WINDOWS
Write-Host "Killing old processes..." -ForegroundColor Yellow
taskkill /f /im python.exe /im node.exe /im expo.exe 2>$null

Write-Host "Starting Django..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'C:\Users\360WEB\DeliveryAppBackend'; .\venv\Scripts\Activate.ps1; python manage.py runserver 0.0.0.0:8000`"" -WindowStyle Minimized

# Wait for Django health check
do {
    Start-Sleep -Seconds 3
    $health = try { Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -UseBasicParsing -TimeoutSec 5 } catch { $null }
} while ($health.StatusCode -ne 200)
Write-Host "Django backend ready on http://localhost:8000" -ForegroundColor Green

Write-Host "Starting Expo (LAN only)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'C:\Users\360WEB\DeliveryAppMobile'; npx.cmd expo start --clear --port 8081`""

Write-Host "`nFULL STACK RUNNING!" -ForegroundColor Green
Write-Host "→ Django : http://localhost:8000" -ForegroundColor White
Write-Host "→ Expo   : Opening in 10 seconds..." -ForegroundColor White
Start-Sleep 10
Start-Process "https://expo.dev/client"
