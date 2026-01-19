# Deployment Anleitung - Charakter Creation

Diese Anleitung beschreibt, wie Sie die Charakter Creation Anwendung auf einem Linux-Server installieren und betreiben.

## Systemvoraussetzungen

- **Betriebssystem**: Ubuntu 20.04+ / Debian 11+ (empfohlen)
- **RAM**: Mindestens 1 GB
- **Festplatte**: Mindestens 2 GB freier Speicher
- **Node.js**: Version 18.x oder höher (wird automatisch installiert)
- **Nginx**: Wird automatisch installiert
- **Root-Zugriff**: Erforderlich für die Installation

## Schnellstart

### 1. Projekt auf den Server übertragen

```bash
# Mit SCP
scp -r /pfad/zum/projekt root@ihr-server:/tmp/charakter-creation

# Oder mit Git
git clone https://github.com/ihr-username/charakter-creation.git
cd charakter-creation
```

### 2. Installation ausführen

```bash
cd charakter-creation
chmod +x install.sh
sudo ./install.sh
```

Das Installationsskript führt automatisch folgende Schritte aus:
- ✓ Installiert Node.js und npm (falls nicht vorhanden)
- ✓ Installiert SQLite3
- ✓ Erstellt Systembenutzer und Verzeichnisse
- ✓ Installiert alle Dependencies
- ✓ Baut das Frontend
- ✓ Kompiliert das Backend
- ✓ Initialisiert die Datenbank
- ✓ Richtet Systemd Service ein
- ✓ Konfiguriert Nginx als Reverse Proxy
- ✓ Startet alle Services

### 3. Fertig!

Nach erfolgreicher Installation ist die Anwendung erreichbar unter:
```
http://ihre-server-ip
```

## Konfiguration

### Backend (.env)

Die Backend-Konfiguration befindet sich in `/opt/charakter-creation/backend/.env`:

```env
# Database
DATABASE_URL=./database.sqlite

# Server
PORT=3000
NODE_ENV=production

# JWT Secret (wird automatisch generiert)
JWT_SECRET=ihr-geheimer-schluessel

# CORS
ALLOWED_ORIGINS=http://localhost,http://ihre-server-ip

# Logging
LOG_LEVEL=info
```

### Frontend (.env)

Die Frontend-Konfiguration befindet sich in `/opt/charakter-creation/frontend/.env`:

```env
VITE_API_URL=http://ihre-server-ip:3000
```

**Wichtig**: Nach Änderungen an den Umgebungsvariablen müssen Sie die Anwendung neu bauen und starten:

```bash
cd /opt/charakter-creation/frontend
npm run build
sudo systemctl restart charakter-backend
sudo systemctl restart nginx
```

## Verwaltung

### Service-Befehle

```bash
# Status prüfen
sudo systemctl status charakter-backend

# Service starten
sudo systemctl start charakter-backend

# Service stoppen
sudo systemctl stop charakter-backend

# Service neustarten
sudo systemctl restart charakter-backend

# Logs anzeigen
sudo journalctl -u charakter-backend -f
```

### Nginx

```bash
# Nginx neustarten
sudo systemctl restart nginx

# Nginx Status
sudo systemctl status nginx

# Fehler-Logs anzeigen
sudo tail -f /var/log/nginx/error.log

# Zugriffs-Logs anzeigen
sudo tail -f /var/log/nginx/access.log
```

### Datenbank

Die SQLite-Datenbank befindet sich hier:
```
/opt/charakter-creation/backend/database.sqlite
```

Backup erstellen:
```bash
sudo cp /opt/charakter-creation/backend/database.sqlite \
       /opt/charakter-creation/backend/database.backup.sqlite
```

## Updates

### Automatisches Update

```bash
cd /pfad/zum/projekt
chmod +x update.sh
sudo ./update.sh
```

Das Update-Script:
- Erstellt automatisch ein Backup
- Aktualisiert alle Dateien
- Installiert neue Dependencies
- Baut Frontend und Backend neu
- Führt Datenbank-Migrationen aus
- Startet die Services neu

### Manuelles Update

```bash
# 1. Backup erstellen
sudo cp -r /opt/charakter-creation /opt/charakter-creation-backup

# 2. Service stoppen
sudo systemctl stop charakter-backend

# 3. Neue Dateien kopieren
sudo cp -r backend/src/* /opt/charakter-creation/backend/src/
sudo cp -r frontend/src/* /opt/charakter-creation/frontend/src/

# 4. Dependencies aktualisieren
cd /opt/charakter-creation/backend
sudo -u charakter npm install
cd /opt/charakter-creation/frontend
sudo -u charakter npm install

# 5. Frontend bauen
sudo -u charakter npm run build

# 6. Backend kompilieren
cd /opt/charakter-creation/backend
sudo -u charakter npx tsc

# 7. Service starten
sudo systemctl start charakter-backend
```

## Deinstallation

```bash
chmod +x uninstall.sh
sudo ./uninstall.sh
```

Das Deinstallations-Script entfernt:
- Systemd Service
- Nginx Konfiguration
- Optional: Projektverzeichnis und Benutzer

## SSL/HTTPS einrichten

### Mit Let's Encrypt (kostenlos)

```bash
# Certbot installieren
sudo apt-get install certbot python3-certbot-nginx

# SSL Zertifikat erstellen
sudo certbot --nginx -d ihre-domain.de

# Automatische Erneuerung aktivieren (bereits automatisch aktiv)
sudo certbot renew --dry-run
```

### Nginx SSL Konfiguration manuell

Bearbeiten Sie `/etc/nginx/sites-available/charakter-creation`:

```nginx
server {
    listen 443 ssl http2;
    server_name ihre-domain.de;

    ssl_certificate /pfad/zum/certificate.crt;
    ssl_certificate_key /pfad/zum/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Rest der Konfiguration...
}

server {
    listen 80;
    server_name ihre-domain.de;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring

### Systemressourcen überwachen

```bash
# CPU und RAM Nutzung
htop

# Disk Space
df -h

# Node.js Prozess überwachen
ps aux | grep node
```

### Application Monitoring

```bash
# Backend Logs live anzeigen
sudo journalctl -u charakter-backend -f

# Letzte 100 Zeilen
sudo journalctl -u charakter-backend -n 100

# Fehler filtern
sudo journalctl -u charakter-backend -p err
```

### Performance Monitoring (Optional)

Installieren Sie PM2 für erweiterte Überwachung:

```bash
sudo npm install -g pm2

# Backend mit PM2 starten (anstelle von systemd)
cd /opt/charakter-creation/backend
pm2 start dist/server.js --name charakter-backend
pm2 save
pm2 startup
```

## Troubleshooting

### Backend startet nicht

```bash
# Logs prüfen
sudo journalctl -u charakter-backend -n 50

# Manuell starten zum Debuggen
cd /opt/charakter-creation/backend
sudo -u charakter node dist/server.js
```

### Frontend zeigt keine Verbindung

1. Prüfen Sie `frontend/.env` - ist `VITE_API_URL` korrekt?
2. Bauen Sie das Frontend neu: `cd frontend && npm run build`
3. Prüfen Sie Nginx Logs: `sudo tail -f /var/log/nginx/error.log`

### Datenbankfehler

```bash
# Berechtigungen prüfen
ls -la /opt/charakter-creation/backend/database.sqlite

# Berechtigungen korrigieren
sudo chown charakter:charakter /opt/charakter-creation/backend/database.sqlite
sudo chmod 644 /opt/charakter-creation/backend/database.sqlite
```

### Port bereits in Verwendung

```bash
# Prüfen welcher Prozess Port 3000 nutzt
sudo lsof -i :3000

# Prozess beenden
sudo kill -9 <PID>
```

## Best Practices

### Sicherheit

1. **Firewall aktivieren**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   ```

2. **Regelmäßige Updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **JWT Secret ändern**: Generieren Sie einen starken JWT Secret in der `.env`

4. **HTTPS verwenden**: Siehe SSL/HTTPS Abschnitt

### Backups

Erstellen Sie regelmäßige Backups:

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/charakter-creation-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r /opt/charakter-creation/backend/database.sqlite $BACKUP_DIR/
cp /opt/charakter-creation/backend/.env $BACKUP_DIR/
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR
```

Fügen Sie zu crontab hinzu für tägliche Backups:
```bash
crontab -e
# Fügen Sie hinzu:
0 2 * * * /pfad/zu/backup.sh
```

## Support

Bei Problemen:
1. Prüfen Sie die Logs: `sudo journalctl -u charakter-backend -f`
2. Überprüfen Sie die Konfigurationsdateien
3. Stellen Sie sicher, dass alle Ports frei sind
4. Prüfen Sie Datei-Berechtigungen

## Nützliche Links

- [Node.js Dokumentation](https://nodejs.org/docs/)
- [Nginx Dokumentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [PM2 Dokumentation](https://pm2.keymetrics.io/)
