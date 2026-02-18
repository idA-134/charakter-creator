# Startet beide Server mit PM2
Write-Host "Starte Server mit PM2..."
Write-Host ""

pm2 delete all 2>$null

Write-Host "Baue Backend..."
Push-Location backend
npm run build
Pop-Location

Write-Host ""
Write-Host "Starte Server..."
pm2 start ecosystem.config.js

Write-Host ""
pm2 status

Write-Host ""
Write-Host "Server gestartet!"
Write-Host ""
Write-Host "Befehle:"
Write-Host "  pm2 status     - Status"
Write-Host "  pm2 logs       - Logs"
Write-Host "  pm2 restart all - Neustart"
Write-Host "  pm2 stop all    - Stoppen"
Write-Host ""
