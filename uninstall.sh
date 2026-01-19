#!/bin/bash

# Charakter Creation - Deinstallationsskript
# Dieses Script entfernt die Anwendung vollständig vom Server

set -e

echo "================================================"
echo "Charakter Creation - Deinstallation"
echo "================================================"
echo ""

# Farben
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

# Prüfe root
if [ "$EUID" -ne 0 ]; then 
    print_error "Bitte als root ausführen (sudo ./uninstall.sh)"
    exit 1
fi

APP_DIR="/opt/charakter-creation"
APP_USER="charakter"

# Bestätigung
read -p "Möchten Sie Charakter Creation wirklich deinstallieren? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deinstallation abgebrochen"
    exit 0
fi

# Services stoppen
print_info "Stoppe Services..."
systemctl stop charakter-backend 2>/dev/null || true
systemctl disable charakter-backend 2>/dev/null || true
print_success "Services gestoppt"

# Systemd Service entfernen
print_info "Entferne Systemd Service..."
rm -f /etc/systemd/system/charakter-backend.service
systemctl daemon-reload
print_success "Systemd Service entfernt"

# Nginx Konfiguration entfernen
print_info "Entferne Nginx Konfiguration..."
rm -f /etc/nginx/sites-available/charakter-creation
rm -f /etc/nginx/sites-enabled/charakter-creation
systemctl restart nginx 2>/dev/null || true
print_success "Nginx Konfiguration entfernt"

# Projektverzeichnis entfernen
read -p "Projektverzeichnis $APP_DIR löschen? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Lösche Projektverzeichnis..."
    rm -rf $APP_DIR
    print_success "Projektverzeichnis gelöscht"
fi

# Benutzer entfernen
read -p "Benutzer $APP_USER löschen? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Lösche Benutzer..."
    userdel -r $APP_USER 2>/dev/null || true
    print_success "Benutzer gelöscht"
fi

echo ""
print_success "Deinstallation abgeschlossen!"
