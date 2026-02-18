# Stoppt alle Server die mit PM2 laufen
Write-Host "🛑 Stoppe alle Server..."

pm2 stop all
pm2 delete all

Write-Host ""
Write-Host "✅ Alle Server gestoppt und aus PM2 entfernt"
