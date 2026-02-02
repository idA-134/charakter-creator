#!/bin/bash

################################################################################
# Vollautomatisches Installation Script für Ubuntu Server
# Installiert: PostgreSQL, Node.js, PM2, nginx, SSL, Firewall
# 
# Nutzung: 
#   chmod +x install-ubuntu-production.sh
#   sudo ./install-ubuntu-production.sh
################################################################################

set -e  # Exit bei Fehler

echo "🚀 Charakter Creation - Ubuntu Production Setup"
echo "================================================"

# Farben für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variablen
APP_NAME="charakter-creation"
APP_USER="charakter"
APP_DIR="/opt/charakter-creation"
DB_NAME="charakter_db"
DB_USER="charakter"
DB_PASSWORD=""  # Wird generiert

# Funktion: Status ausgeben
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Prüfe Root-Rechte
if [ "$EUID" -ne 0 ]; then 
    print_error "Bitte als root ausführen (sudo ./install-ubuntu-production.sh)"
    exit 1
fi

print_status "System Update..."
apt update && apt upgrade -y

# 1. PostgreSQL installieren
echo ""
echo "📦 PostgreSQL Installation..."
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
print_status "PostgreSQL installiert"

# Generiere sicheres Passwort
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# PostgreSQL konfigurieren
print_status "PostgreSQL Datenbank wird erstellt..."
sudo -u postgres psql <<EOF
-- Erstelle Datenbank
CREATE DATABASE ${DB_NAME};

-- Erstelle User
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Vergebe Rechte
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Verbindung zur DB
\c ${DB_NAME}

-- Vergebe Schema-Rechte
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
EOF

print_status "Datenbank '${DB_NAME}' erstellt"

# 2. Node.js 20 LTS installieren
echo ""
echo "📦 Node.js Installation..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version
print_status "Node.js installiert"

# 3. PM2 installieren (Process Manager)
echo ""
echo "📦 PM2 Installation..."
npm install -g pm2
pm2 startup systemd -u ${APP_USER} --hp /home/${APP_USER}
print_status "PM2 installiert"

# 4. Application User erstellen
echo ""
echo "👤 Application User erstellen..."
if ! id "${APP_USER}" &>/dev/null; then
    useradd -r -m -s /bin/bash ${APP_USER}
    print_status "User '${APP_USER}' erstellt"
else
    print_warning "User '${APP_USER}' existiert bereits"
fi

# 5. Application Directory erstellen
echo ""
echo "📁 Application Directory..."
mkdir -p ${APP_DIR}
chown -R ${APP_USER}:${APP_USER} ${APP_DIR}
print_status "Directory ${APP_DIR} erstellt"

# 6. nginx installieren
echo ""
echo "📦 nginx Installation..."
apt install -y nginx
systemctl enable nginx
print_status "nginx installiert"

# 7. Firewall konfigurieren
echo ""
echo "🔥 Firewall konfigurieren..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 5432/tcp  # PostgreSQL (nur intern nutzen!)
print_status "Firewall konfiguriert"

# 8. SSL mit Let's Encrypt vorbereiten
echo ""
echo "🔒 Certbot für SSL installieren..."
apt install -y certbot python3-certbot-nginx
print_status "Certbot installiert"

# 9. PostgreSQL für remote connections konfigurieren (optional)
print_warning "PostgreSQL akzeptiert derzeit nur lokale Verbindungen"
print_warning "Für remote Zugriff: /etc/postgresql/*/main/pg_hba.conf anpassen"

# 10. Backup-Script erstellen
echo ""
echo "💾 Backup-Script erstellen..."
cat > /usr/local/bin/backup-charakter-db.sh <<'BACKUP_SCRIPT'
#!/bin/bash
# Automatisches Datenbank-Backup
BACKUP_DIR="/var/backups/charakter"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p ${BACKUP_DIR}

# PostgreSQL Backup
sudo -u postgres pg_dump charakter_db | gzip > ${BACKUP_DIR}/charakter_db_${DATE}.sql.gz

# Alte Backups löschen (älter als 30 Tage)
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

echo "✓ Backup erstellt: ${BACKUP_DIR}/charakter_db_${DATE}.sql.gz"
BACKUP_SCRIPT

chmod +x /usr/local/bin/backup-charakter-db.sh
print_status "Backup-Script erstellt"

# 11. Cron Job für tägliches Backup
echo ""
echo "⏰ Tägliches Backup einrichten..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-charakter-db.sh") | crontab -
print_status "Tägliches Backup (2:00 Uhr) konfiguriert"

# 12. .env Template erstellen
echo ""
echo "📝 .env Template erstellen..."
cat > ${APP_DIR}/.env.template <<ENV_TEMPLATE
# PostgreSQL Database Connection
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

# JWT Secret (ändern!)
JWT_SECRET=$(openssl rand -base64 64)

# Server Config
PORT=3000
NODE_ENV=production

# CORS Origins (deine Domain eintragen)
CORS_ORIGIN=https://yourdomain.com
ENV_TEMPLATE

print_status ".env Template erstellt"

# 13. nginx Konfiguration erstellen
echo ""
echo "🌐 nginx Konfiguration erstellen..."
cat > /etc/nginx/sites-available/${APP_NAME} <<NGINX_CONFIG
server {
    listen 80;
    server_name _;  # Später durch echte Domain ersetzen

    # Größere Uploads erlauben (für Datei-Uploads)
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static Files (Frontend)
    location /assets {
        alias ${APP_DIR}/frontend/dist/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG

ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
print_status "nginx konfiguriert"

# 14. PM2 Ecosystem File erstellen
echo ""
echo "📋 PM2 Ecosystem File erstellen..."
cat > ${APP_DIR}/ecosystem.config.js <<PM2_CONFIG
module.exports = {
  apps: [{
    name: 'charakter-backend',
    script: './backend/dist/server.js',
    cwd: '${APP_DIR}',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '${APP_DIR}/logs/err.log',
    out_file: '${APP_DIR}/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
PM2_CONFIG

chown ${APP_USER}:${APP_USER} ${APP_DIR}/ecosystem.config.js
print_status "PM2 Konfiguration erstellt"

# 15. Logs Directory
mkdir -p ${APP_DIR}/logs
chown -R ${APP_USER}:${APP_USER} ${APP_DIR}/logs

# Zusammenfassung ausgeben
echo ""
echo "============================================"
echo "✅ Installation abgeschlossen!"
echo "============================================"
echo ""
echo "📋 Wichtige Informationen:"
echo "-------------------------------------------"
echo "App Directory:    ${APP_DIR}"
echo "App User:         ${APP_USER}"
echo "Database:         ${DB_NAME}"
echo "DB User:          ${DB_USER}"
echo "DB Password:      ${DB_PASSWORD}"
echo ""
echo "🔐 WICHTIG: Speichere das DB-Passwort sicher!"
echo ""
echo "📝 Nächste Schritte:"
echo "-------------------------------------------"
echo "1. App Code nach ${APP_DIR} deployen"
echo "2. .env File erstellen (Template: ${APP_DIR}/.env.template)"
echo "3. Dependencies installieren: cd ${APP_DIR}/backend && npm install"
echo "4. TypeScript kompilieren: npm run build"
echo "5. Datenbank migrieren: npm run db:migrate"
echo "6. App starten: pm2 start ecosystem.config.js"
echo "7. PM2 speichern: pm2 save"
echo ""
echo "📊 Nützliche Befehle:"
echo "-------------------------------------------"
echo "pm2 status                    # Status prüfen"
echo "pm2 logs                      # Logs anzeigen"
echo "pm2 restart charakter-backend # Neustart"
echo "pm2 monit                     # Monitoring"
echo ""
echo "🔒 SSL Zertifikat einrichten:"
echo "-------------------------------------------"
echo "certbot --nginx -d yourdomain.com"
echo ""
echo "💾 Manuelles Backup:"
echo "-------------------------------------------"
echo "/usr/local/bin/backup-charakter-db.sh"
echo ""

# Passwort in Datei speichern (nur für root lesbar)
echo "${DB_PASSWORD}" > /root/.charakter_db_password
chmod 600 /root/.charakter_db_password
print_status "DB-Passwort gespeichert in /root/.charakter_db_password"

echo ""
print_status "Setup abgeschlossen! 🎉"
