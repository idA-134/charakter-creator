#!/bin/bash

# Charakter Creation - Update Script
# Dieses Script aktualisiert die Anwendung auf dem Server

set -e

echo "================================================"
echo "Charakter Creation - Update"
echo "================================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

if [ "$EUID" -ne 0 ]; then 
    print_error "Bitte als root ausführen (sudo ./update.sh)"
    exit 1
fi

APP_DIR="/opt/charakter-creation"
APP_USER="charakter"
BACKUP_DIR="/opt/charakter-creation-backup-$(date +%Y%m%d-%H%M%S)"

# 1. Backup erstellen
print_info "Erstelle Backup..."
cp -r $APP_DIR $BACKUP_DIR
print_success "Backup erstellt: $BACKUP_DIR"

# 2. Service stoppen
print_info "Stoppe Backend Service..."
systemctl stop charakter-backend
print_success "Service gestoppt"

# 3. Neue Dateien kopieren
print_info "Kopiere neue Dateien..."
CURRENT_DIR=$(pwd)
cp -r $CURRENT_DIR/backend/src/* $APP_DIR/backend/src/
cp -r $CURRENT_DIR/frontend/src/* $APP_DIR/frontend/src/
cp -r $CURRENT_DIR/frontend/public/* $APP_DIR/frontend/public/ 2>/dev/null || true

# Behalte .env Dateien
cp $BACKUP_DIR/backend/.env $APP_DIR/backend/.env 2>/dev/null || true
cp $BACKUP_DIR/frontend/.env $APP_DIR/frontend/.env 2>/dev/null || true

chown -R $APP_USER:$APP_USER $APP_DIR
print_success "Dateien aktualisiert"

# 4. Dependencies aktualisieren
print_info "Aktualisiere Backend Dependencies..."
cd $APP_DIR/backend
sudo -u $APP_USER npm install --production
print_success "Backend Dependencies aktualisiert"

print_info "Aktualisiere Frontend Dependencies..."
cd $APP_DIR/frontend
sudo -u $APP_USER npm install
print_success "Frontend Dependencies aktualisiert"

# 5. Frontend bauen
print_info "Baue Frontend..."
sudo -u $APP_USER npm run build
print_success "Frontend gebaut"

# 6. Backend kompilieren
print_info "Kompiliere Backend..."
cd $APP_DIR/backend
sudo -u $APP_USER npx tsc
print_success "Backend kompiliert"

# 7. Datenbank Migration (falls vorhanden)
if [ -f "$APP_DIR/backend/dist/database/migrate.js" ]; then
    print_info "Führe Datenbank Migration aus..."
    sudo -u $APP_USER node dist/database/migrate.js
    print_success "Datenbank migriert"
fi

# 8. Service starten
print_info "Starte Backend Service..."
systemctl start charakter-backend
print_success "Service gestartet"

# 9. Status prüfen
sleep 2
if systemctl is-active --quiet charakter-backend; then
    print_success "Update erfolgreich abgeschlossen!"
    echo ""
    echo "Service Status:"
    systemctl status charakter-backend --no-pager -l | head -n 10
else
    print_error "Service konnte nicht gestartet werden!"
    print_info "Stelle Backup wieder her mit: sudo cp -r $BACKUP_DIR/* $APP_DIR/"
    exit 1
fi

echo ""
print_info "Backup wurde erstellt unter: $BACKUP_DIR"
print_info "Sie können es mit 'sudo rm -rf $BACKUP_DIR' löschen, wenn alles funktioniert"
