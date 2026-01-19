# Bereitet das Projekt fuer den Server-Upload vor (Windows PowerShell)
# Loescht alle unnoetigen Dateien und Verzeichnisse

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Charakter Creation - Deployment Vorbereitung" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

function Print-Success($message) {
    Write-Host "OK $message" -ForegroundColor Green
}

function Print-Info($message) {
    Write-Host "-> $message" -ForegroundColor Yellow
}

# Verzeichnisse die geloescht werden koennen
Print-Info "Loesche node_modules Verzeichnisse..."
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "backend\node_modules") { Remove-Item -Recurse -Force "backend\node_modules" }
if (Test-Path "frontend\node_modules") { Remove-Item -Recurse -Force "frontend\node_modules" }
Print-Success "node_modules geloescht"

Print-Info "Loesche Build-Verzeichnisse..."
if (Test-Path "backend\dist") { Remove-Item -Recurse -Force "backend\dist" }
if (Test-Path "frontend\dist") { Remove-Item -Recurse -Force "frontend\dist" }
if (Test-Path "frontend\build") { Remove-Item -Recurse -Force "frontend\build" }
Print-Success "Build-Verzeichnisse geloescht"

Print-Info "Loesche Datenbank-Dateien..."
Get-ChildItem -Path "backend" -Filter "*.sqlite" -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path "backend" -Filter "*.db" -ErrorAction SilentlyContinue | Remove-Item -Force
if (Test-Path "backend\database.sqlite-journal") { Remove-Item -Force "backend\database.sqlite-journal" }
Print-Success "Datenbank-Dateien geloescht"

Print-Info "Loesche .env Dateien..."
if (Test-Path "backend\.env") { Remove-Item -Force "backend\.env" }
if (Test-Path "frontend\.env") { Remove-Item -Force "frontend\.env" }
if (Test-Path ".env") { Remove-Item -Force ".env" }
Print-Success ".env Dateien geloescht"

Print-Info "Loesche Log-Dateien..."
if (Test-Path "logs") { Remove-Item -Recurse -Force "logs" }
Get-ChildItem -Filter "*.log" -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path "backend" -Filter "*.log" -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path "frontend" -Filter "*.log" -ErrorAction SilentlyContinue | Remove-Item -Force
Print-Success "Log-Dateien geloescht"

Print-Info "Loesche temporaere Dateien..."
if (Test-Path "tmp") { Remove-Item -Recurse -Force "tmp" }
if (Test-Path "temp") { Remove-Item -Recurse -Force "temp" }
Get-ChildItem -Filter "*.tmp" -ErrorAction SilentlyContinue | Remove-Item -Force
Print-Success "Temporaere Dateien geloescht"

Print-Info "Loesche IDE-Konfigurationen..."
if (Test-Path ".vscode") { Remove-Item -Recurse -Force ".vscode" }
if (Test-Path ".idea") { Remove-Item -Recurse -Force ".idea" }
Print-Success "IDE-Konfigurationen geloescht"

Print-Info "Loesche Coverage und Test-Ausgaben..."
if (Test-Path "coverage") { Remove-Item -Recurse -Force "coverage" }
if (Test-Path ".nyc_output") { Remove-Item -Recurse -Force ".nyc_output" }
Print-Success "Test-Ausgaben geloescht"

# Optional: .git Verzeichnis
$response = Read-Host "Moechten Sie auch .git\ loeschen? (y/N)"
if ($response -eq "y" -or $response -eq "Y") {
    Print-Info "Loesche .git Verzeichnis..."
    if (Test-Path ".git") { Remove-Item -Recurse -Force ".git" }
    Print-Success ".git geloescht"
}

Write-Host ""
Print-Success "Projekt bereit fuer Upload!"
Write-Host ""
Write-Host "Das Projekt kann jetzt auf den Server uebertragen werden mit:" -ForegroundColor Cyan
Write-Host "  scp -r . root@server:/tmp/charakter_creation" -ForegroundColor White
Write-Host ""
