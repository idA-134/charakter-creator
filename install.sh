#!/bin/bash

# 🎮 Charakter Creation - Die Beschwörung beginnt
# Ein episches Quest zur Installation deines eigenen RPG-Systems

set -e  # Ein wahrer Held gibt nicht auf bei Fehlern!

echo "╔════════════════════════════════════════════════╗"
echo "║   🎮 WILLKOMMEN IN CHARAKTER CREATION 🎮      ║"
echo "║                                                ║"
echo "║  Die Reise eines IT-Abenteurers beginnt hier  ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "🗺️  Du bist dabei, eine mächtige Akademie für"
echo "    aufstrebende Fachinformatiker zu errichten!"
echo ""
echo "⚔️  Diese Installation wird folgende Quests abschließen:"
echo "    • Das Fundament legen (Systemprüfung)"
echo "    • Die heiligen Bibliotheken sammeln (Dependencies)"
echo "    • Die Datenbank der Weisen erschaffen"
echo "    • Die Wächter-Dienste beschwören (Backend & Nginx)"
echo "    • Das Portal öffnen (Frontend aktivieren)"
echo ""
echo "🎯 Bereite dich vor, Abenteurer..."
echo ""

# 🎨 Magische Farben für deine Reise
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 🎭 Funktionen für epische Nachrichten
print_success() {
    echo -e "${GREEN}⚔️  Quest erfüllt: $1${NC}"
}

print_error() {
    echo -e "${RED}💀 Fehler aufgetreten: $1${NC}"
}

print_info() {
    echo -e "${YELLOW}🔮 $1${NC}"
}

print_quest() {
    echo ""
    echo -e "${BLUE}╭─────────────────────────────────────────╮${NC}"
    echo -e "${BLUE}│ 📜 QUEST: $1"
    echo -e "${BLUE}╰─────────────────────────────────────────╯${NC}"
}

# Prüfe ob Script als root ausgeführt wird
if [ "$EUID" -ne 0 ]; then 
    print_error "Du benötigst Admin-Rechte für dieses Abenteuer! (Nutze: sudo ./install.sh)"
    echo "⚠️  Ein mächtiger Zauberer braucht root-Rechte!"
    exit 1
fi

print_quest "Das Fundament prüfen"
print_info "Prüfe die magischen Werkzeuge in deinem System..."

# Node.js Version prüfen
if ! command -v node &> /dev/null; then
    print_info "Die Node.js Kristalle fehlen noch!"
    print_info "Beschwöre Node.js v20.x aus den Tiefen des Internets..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    print_success "Node.js Kristalle erfolgreich gesammelt!"
else
    NODE_VERSION=$(node -v)
    print_success "Node.js Kristalle bereits vorhanden: $NODE_VERSION"
fi

# npm prüfen
if ! command -v npm &> /dev/null; then
    print_error "Das Buch der Pakete (npm) wurde nicht gefunden!"
    exit 1
else
    NPM_VERSION=$(npm -v)
    print_success "Das Buch der Pakete liegt bereit: $NPM_VERSION"
fi

print_quest "Die Akademie errichten"

APP_DIR="/opt/charakter-creation"
APP_USER="charakter"
CURRENT_DIR=$(pwd)

print_info "Erschaffe das Heiligtum der Charaktere unter $APP_DIR..."

# Erstelle Benutzer falls nicht vorhanden
if ! id "$APP_USER" &>/dev/null; then
    print_info "Beschwöre den Wächter '$APP_USER', der über die Akademie wacht..."
    useradd -r -s /bin/bash -d $APP_DIR -m $APP_USER
    print_success "Wächter '$APP_USER' wurde erschaffen und ist nun bereit!"
else
    print_success "Wächter '$APP_USER' wacht bereits über das Reich!"
fi

# Kopiere Projektdateien
print_info "Transportiere die heiligen Schriftrollen zur Akademie..."
mkdir -p $APP_DIR
cp -r $CURRENT_DIR/* $APP_DIR/
chown -R $APP_USER:$APP_USER $APP_DIR
print_success "Alle Schriftrollen sind an ihrem Platz!"
print_quest "Die Runen der Macht gravieren"
print_info "Schreibe die geheimen Konfigurationen nieder
print_info "Konfiguriere Umgebungsvariablen..."

if [ ! -f "$APP_DIR/backend/.env" ]; then
    cat > $APP_DIR/backend/.env << EOF
# Database
DATABASE_URL=postgresql://charakter:DEIN_PASSWORT_HIER@localhost:5432/charakter_db

# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=$(openssl rand -base64 32)

# CORS
ALLOWED_ORIGINS=http://localhost,http://$(hostname -I | awk '{print $1}')

# Optional: Weitere Konfigurationen
LOG_LEVEL=info
EOF
    chown $APP_USER:$APP_USER $APP_DIR/backend/.env
    print_success "Backend-Runen wurden eingraviert!"
else
    print_info "Backend-Runen existieren bereits - bewahre sie"
fi

if [ ! -f "$APP_DIR/frontend/.env" ]; then
    cat > $APP_DIR/frontend/.env << EOF
VITE_API_URL=http://$(hostname -I | awk '{print $1}'):3000
EOF
    chown $APP_USER:$APP_USER $APP_DIR/frontend/.env
    print_success "Frontend-Runen wurden eingraviert!"
else
    print_info "Frontend-Runen existieren bereits - bewahre sie"
fi

print_quest "Die heiligen Bibliotheken sammeln"
print_info "Sammle die mächtigen Zaubersprüche für das Backend..."
cd $APP_DIR/backend
sudo -u $APP_USER npm install --production
print_success "Backend-Bibliotheken erfolgreich gesammelt!"

print_info "Sammle die magischen Elemente für das Frontend..."
cd $APP_DIR/frontend
sudo -u $APP_USER npm install
print_success "Frontend-Bibliotheken erfolgreich gesammelt!"

print_quest "Die Portalmagie weben"
print_info "Erschaffe das Portal für die Abenteurer (Frontend Build)..."
cd $APP_DIR/frontend
sudo -u $APP_USER npm run build
print_success "Das Portal steht bereit und glänzt in voller Pracht!"

print_quest "Die Backend-Magie kompilieren"
print_info "Verwandle TypeScript in ausführbare Zaubersprüche..."
cd $APP_DIR/backend
sudo -u $APP_USER npm install typescript @types/node --save-dev
sudo -u $APP_USER npx tsc
print_success "Die Backend-Magie ist nun einsatzbereit!"

print_quest "Die Datenbank der Weisen erschaffen"
print_info "Erschaffe die Chroniken, in denen alle Heldentaten verzeichnet werden..."
cd $APP_DIR/backend
sudo -u $APP_USER node dist/database/migrate-postgres.js
print_success "Die Datenbank der Weisen wurde erschaffen!"

print_info "Erschaffe den Großmeister der Akademie..."
echo ""
echo "🧙 ACHTUNG: Der erste Großmeister wird nun erschaffen!"
echo "   Wähle weise, denn er erhält die höchste Macht..."
echo ""
sudo -u $APP_USER node dist/database/setup-admin.js
print_success "Der Großmeister wurde ernannt und ist bereit!"

# 7c. Seed-Daten (optional)
if [ -f "dist/database/seed.js" ]; then
    print_info "Bevölkere die Welt mit ersten Quests und Schätzen..."
    sudo -u $APP_USER node dist/database/seed.js
    print_success "Die Welt ist nun bereit für Abenteurer!"
print_quest "Die Wächter-Dienste beschwören"
print_info "Beschwöre den ewigen Wächter, der das Backend beschützt
# 8. Systemd Service erstellen
print_info "Erstelle Systemd Service..."

cat > /etc/systemd/system/charakter-backend.service << EOF
[Unit]
Description=Charakter Creation Backend
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=charakter-backend

[Install]
WantedBy=multi-user.target
EOFDer Backend-Wächter wurde beschworen und ist bereit!"

print_quest "Den Torwächter aufstellen"
print_info "Installiere Nginx, den mächtigen Torwächter
# 9. Nginx installieren und konfigurieren
print_info "Installiere und konfiguriere Nginx..."

if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    print_success "Nginx, der Torwächter, wurde herbeigerufen!"
else
    print_success "Nginx wacht bereits über das Tor!"
fi

print_info "Konfiguriere den Torwächter für deine Akademie..."

cat > /etc/nginx/sites-available/charakter-creation << EOF
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root $APP_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static Assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root $APP_DIR/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Aktiviere Site
ln -sf /etc/nginx/sites-available/charakter-creation /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Teste Nginx KDer Torwächter ist konfiguriert und bereit!"

print_quest "Erwecke die Dienste zum Leben"
print_info "Hauche den Diensten Leben ein..."

systemctl daemon-reload
systemctl enable charakter-backend
systemctl start charakter-backend
systemctl restart nginx

print_success "Alle Dienste sind erwacht und aktiv!

print_success "Services gestartet"

# 11. Firewall kErrichte Schutzzauber um deine Akademie..."
    ufw allow 'Nginx Full'
    ufw allow ssh
    print_success "Die Schutzzauber sind aktiv!"
fi

# 12. Status prüfen
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║                                                ║"
echo "║     ⚔️  QUEST ERFOLGREICH ABGESCHLOSSEN! ⚔️   ║"
echo "║                                                ║"
echo "╚════════════════════════════════════════════════╝"
echo "📊 Status der Wächter:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
systemctl status charakter-backend --no-pager -l | head -n 10
echo ""
systemctl status nginx --no-pager -l | head -n 5
echo ""

SERVER_IP=$(hostname -I | awk '{print $1}')
echo "╔════════════════════════════════════════════════╗"
echo "║              🌐 DAS PORTAL IST OFFEN           ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🎮 Deine Akademie ist erreichbar unter:${NC}"
echo -e "   ${MAGENTA}➜ http://$SERVER_IP${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📜 ZAUBERSPRÜCHE FÜR SPÄTERSAGEN:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Status überprüfen:"
echo "   sudo systemctl status charakter-backend"
echo ""
echo "📖 Die Chroniken lesen (Logs):"
echo "   sudo journalctl -u charakter-backend -f"
echo ""
echo "🔄 Dienste neu starten:"
echo "   sudo systemctl restart charakter-backend"
echo "   sudo systemctl restart nginx"
echo ""
echo "⚠️  Fehlersuche:"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "💡 Vergiss nicht, die Runen anzupassen wenn nötig:"
echo "    • Backend-Runen: $APP_DIR/backend/.env"
echo "    • Frontend-Runen: $APP_DIR/frontend/.env"
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  🎊 Die Akademie steht! Möge das Abenteuer     ║"
echo "║     beginnen und viele Helden hervorbringen!   ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
print_success "Deine Reise als Akademie-Gründer ist vollendet! 🎉⚔️"
echo "

print_info "Vergessen Sie nicht, die Umgebungsvariablen anzupassen:"
echo "  - Backend: $APP_DIR/backend/.env"
echo "  - Frontend: $APP_DIR/frontend/.env"
echo ""

print_success "Installation erfolgreich abgeschlossen! 🎉"
