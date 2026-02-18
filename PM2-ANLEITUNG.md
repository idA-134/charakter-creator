# PM2 Process Manager - Automatische Server-Überwachung

PM2 überwacht automatisch beide Server (Backend + Frontend) und startet sie bei Abstürzen neu.

## Quick Start

### Server starten
```powershell
.\start-servers.ps1
```

### Server stoppen
```powershell
.\stop-servers.ps1
```

## Manuelle PM2-Befehle

### Status anzeigen
```powershell
pm2 status
```

### Logs in Echtzeit anzeigen
```powershell
pm2 logs                    # Alle Logs
pm2 logs charakter-backend  # Nur Backend
pm2 logs charakter-frontend # Nur Frontend
```

### Monitoring Dashboard
```powershell
pm2 monit
```

### Server neustarten
```powershell
pm2 restart all                    # Beide Server
pm2 restart charakter-backend      # Nur Backend
pm2 restart charakter-frontend     # Nur Frontend
```

### Server stoppen
```powershell
pm2 stop all
```

### Prozesse aus PM2 entfernen
```powershell
pm2 delete all
```

## PM2 als Windows-Dienst (Optional)

Um PM2 als Windows-Dienst zu installieren (startet automatisch beim Systemstart):

### 1. PM2 Startup installieren
```powershell
npm install -g pm2-windows-startup
pm2-startup install
```

### 2. Aktuelle Prozesse speichern
```powershell
pm2 save
```

### 3. Dienst verwalten
```powershell
# Dienst starten
net start PM2

# Dienst stoppen
net stop PM2

# Dienst Status
sc query PM2
```

## Überwachungs-Features

PM2 bietet folgende Features:

- ✅ **Automatischer Neustart** bei Abstürzen
- ✅ **Memory-Überwachung** (Neustart bei zu viel RAM-Verbrauch)
- ✅ **Logs-Management** (alle Logs in logs/-Ordner)
- ✅ **Process Monitoring** (CPU, RAM, Uptime)
- ✅ **Crash-Protection** (max. 10 Neustarts in kurzer Zeit)
- ✅ **Graceful Shutdown** (sauberes Herunterfahren)

## Konfiguration

Die Konfiguration befindet sich in `ecosystem.config.js`.

Wichtige Einstellungen:
- `autorestart: true` - Automatischer Neustart bei Absturz
- `max_memory_restart: '500M'` - Neustart bei 500MB RAM-Verbrauch
- `max_restarts: 10` - Max. 10 Neustarts
- `min_uptime: '10s'` - Mindestlaufzeit 10 Sekunden

## Logs

Alle Logs werden gespeichert in:
- `logs/backend-out.log` - Backend normale Ausgabe
- `logs/backend-err.log` - Backend Fehler
- `logs/frontend-out.log` - Frontend normale Ausgabe
- `logs/frontend-err.log` - Frontend Fehler

## Troubleshooting

### Server startet nicht
```powershell
# Logs prüfen
pm2 logs

# Status prüfen
pm2 status

# Prozesse neu starten
pm2 delete all
.\start-servers.ps1
```

### PM2 komplett zurücksetzen
```powershell
pm2 kill
pm2 delete all
```

### Port bereits belegt
```powershell
# Alle PM2-Prozesse stoppen
pm2 stop all

# Alte Server-Prozesse killen
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { taskkill /PID $_.OwningProcess /F }
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { taskkill /PID $_.OwningProcess /F }

# Neu starten
.\start-servers.ps1
```
