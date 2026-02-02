#!/bin/bash

################################################################################
# Deployment Script für Ubuntu Server
# 
# Dieses Script:
# - Baut die Applikation lokal
# - Transferred Files via rsync/scp zum Server
# - Installiert Dependencies auf dem Server
# - Migriert die Datenbank
# - Startet/Neustart der Applikation mit PM2
# 
# Nutzung:
#   chmod +x deploy.sh
#   ./deploy.sh [environment]
# 
# Environments: production, staging
################################################################################

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Konfiguration (anpassen!)
ENVIRONMENT=${1:-production}
SERVER_USER="charakter"
SERVER_HOST=""  # Hier Server IP/Domain eintragen
SERVER_PORT="22"
APP_DIR="/opt/charakter-creation"
LOCAL_DIR="$(pwd)"

# Funktionen
print_step() {
    echo -e "\n${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Server-Konfiguration prüfen
if [ -z "$SERVER_HOST" ]; then
    print_error "SERVER_HOST ist nicht konfiguriert!"
    print_warning "Bitte in deploy.sh die Variable SERVER_HOST setzen."
    exit 1
fi

# Prüfe ob rsync installiert ist
if ! command -v rsync &> /dev/null; then
    print_error "rsync ist nicht installiert"
    print_warning "Installation: apt install rsync (Ubuntu) oder choco install rsync (Windows)"
    exit 1
fi

echo "🚀 Charakter Creation Deployment"
echo "================================"
echo "Environment: $ENVIRONMENT"
echo "Server:      $SERVER_USER@$SERVER_HOST"
echo "App Dir:     $APP_DIR"
echo ""

# 1. Git Status prüfen
print_step "1. Prüfe Git Status..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Es gibt uncommitted changes!"
    read -p "Trotzdem fortfahren? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
COMMIT_HASH=$(git rev-parse --short HEAD)
print_success "Aktueller Commit: $COMMIT_HASH"

# 2. Tests ausführen (optional)
# print_step "2. Führe Tests aus..."
# npm test
# print_success "Tests bestanden"

# 3. Backend bauen
print_step "2. Baue Backend..."
cd "$LOCAL_DIR/backend"
npm install
npm run build
print_success "Backend gebaut"

# 4. Frontend bauen
print_step "3. Baue Frontend..."
cd "$LOCAL_DIR/frontend"
npm install
npm run build
print_success "Frontend gebaut"

# 5. Backup auf Server erstellen
print_step "4. Erstelle Backup auf Server..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
    # Datenbank Backup
    /usr/local/bin/backup-charakter-db.sh
    
    # App Backup
    if [ -d "/opt/charakter-creation" ]; then
        tar -czf /tmp/charakter-app-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
            /opt/charakter-creation/backend/dist \
            /opt/charakter-creation/frontend/dist \
            /opt/charakter-creation/.env || true
    fi
ENDSSH
print_success "Backup erstellt"

# 6. Files zum Server transferieren
print_step "5. Transferiere Files zum Server..."

# Erstelle temporäres Verzeichnis für Transfer
TEMP_DIR=$(mktemp -d)
cd "$LOCAL_DIR"

# Backend
mkdir -p "$TEMP_DIR/backend/dist"
cp -r backend/dist/* "$TEMP_DIR/backend/dist/"
cp backend/package.json "$TEMP_DIR/backend/"
cp backend/package-lock.json "$TEMP_DIR/backend/" || true

# Frontend
mkdir -p "$TEMP_DIR/frontend/dist"
cp -r frontend/dist/* "$TEMP_DIR/frontend/dist/"

# Scripts
cp ecosystem.config.js "$TEMP_DIR/" || true

# rsync zum Server
rsync -avz --delete \
    -e "ssh -p $SERVER_PORT" \
    "$TEMP_DIR/" \
    "$SERVER_USER@$SERVER_HOST:$APP_DIR/"

# Cleanup
rm -rf "$TEMP_DIR"
print_success "Files transferred"

# 7. Dependencies auf Server installieren
print_step "6. Installiere Dependencies auf Server..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << ENDSSH
    cd $APP_DIR/backend
    npm install --production
ENDSSH
print_success "Dependencies installiert"

# 8. Datenbank Migration (optional, nur wenn nötig)
# print_step "7. Führe Datenbank-Migration aus..."
# ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << ENDSSH
#     cd $APP_DIR/backend
#     npm run db:migrate
# ENDSSH
# print_success "Migration abgeschlossen"

# 9. PM2 Neustart
print_step "7. Starte Applikation neu..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << ENDSSH
    cd $APP_DIR
    
    # PM2 Neustart
    if pm2 list | grep -q "charakter-backend"; then
        pm2 reload charakter-backend
    else
        pm2 start ecosystem.config.js
    fi
    
    # PM2 Status speichern
    pm2 save
ENDSSH
print_success "Applikation gestartet"

# 10. Health Check
print_step "8. Health Check..."
sleep 3
STATUS=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "pm2 jlist" | jq -r '.[0].pm2_env.status')
if [ "$STATUS" == "online" ]; then
    print_success "Applikation läuft: $STATUS"
else
    print_error "Applikation Status: $STATUS"
    print_warning "Prüfe Logs mit: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs'"
    exit 1
fi

# 11. Zusammenfassung
echo ""
echo "================================"
print_success "Deployment abgeschlossen! 🎉"
echo "================================"
echo ""
echo "📋 Details:"
echo "   Commit:      $COMMIT_HASH"
echo "   Environment: $ENVIRONMENT"
echo "   Server:      $SERVER_HOST"
echo ""
echo "📊 Nützliche Befehle:"
echo "   ssh $SERVER_USER@$SERVER_HOST 'pm2 status'     # Status"
echo "   ssh $SERVER_USER@$SERVER_HOST 'pm2 logs'       # Logs"
echo "   ssh $SERVER_USER@$SERVER_HOST 'pm2 monit'      # Monitoring"
echo "   ssh $SERVER_USER@$SERVER_HOST 'pm2 restart charakter-backend'  # Neustart"
echo ""
