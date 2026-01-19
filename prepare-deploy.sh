#!/bin/bash

# Bereitet das Projekt für den Server-Upload vor
# Löscht alle unnötigen Dateien und Verzeichnisse

set -e

echo "================================================"
echo "Charakter Creation - Deployment Vorbereitung"
echo "================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Verzeichnisse die gelöscht werden können
print_info "Lösche node_modules Verzeichnisse..."
rm -rf node_modules/
rm -rf backend/node_modules/
rm -rf frontend/node_modules/
print_success "node_modules gelöscht"

print_info "Lösche Build-Verzeichnisse..."
rm -rf backend/dist/
rm -rf frontend/dist/
rm -rf frontend/build/
print_success "Build-Verzeichnisse gelöscht"

print_info "Lösche Datenbank-Dateien..."
rm -rf backend/*.sqlite
rm -rf backend/*.db
rm -rf backend/database.sqlite-journal
print_success "Datenbank-Dateien gelöscht"

print_info "Lösche .env Dateien..."
rm -f backend/.env
rm -f frontend/.env
rm -f .env
print_success ".env Dateien gelöscht"

print_info "Lösche Log-Dateien..."
rm -rf logs/
rm -f *.log
rm -f backend/*.log
rm -f frontend/*.log
print_success "Log-Dateien gelöscht"

print_info "Lösche temporäre Dateien..."
rm -rf tmp/
rm -rf temp/
rm -f *.tmp
print_success "Temporäre Dateien gelöscht"

print_info "Lösche IDE-Konfigurationen..."
rm -rf .vscode/
rm -rf .idea/
print_success "IDE-Konfigurationen gelöscht"

print_info "Lösche Coverage und Test-Ausgaben..."
rm -rf coverage/
rm -rf .nyc_output/
print_success "Test-Ausgaben gelöscht"

# Optional: Git Verzeichnis
read -p "Möchten Sie auch .git/ löschen? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Lösche .git Verzeichnis..."
    rm -rf .git/
    print_success ".git gelöscht"
fi

echo ""
print_success "Projekt bereit für Upload!"
echo ""
echo "Das Projekt kann jetzt auf den Server übertragen werden:"
echo "  tar -czf charakter-creation.tar.gz ."
echo "  scp charakter-creation.tar.gz root@server:/tmp/"
echo ""
