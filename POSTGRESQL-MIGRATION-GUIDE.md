# PostgreSQL Migration Guide

Vollständige Anleitung für die Migration von SQLite zu PostgreSQL.

## 📋 Inhaltsverzeichnis

1. [Lokale Entwicklung mit Docker](#lokale-entwicklung-mit-docker)
2. [Production Setup auf Ubuntu Server](#production-setup-auf-ubuntu-server)
3. [Daten-Migration von SQLite](#daten-migration-von-sqlite)
4. [Deployment](#deployment)
5. [Troubleshooting](#troubleshooting)

---

## 🐳 Lokale Entwicklung mit Docker

### Voraussetzungen
- Docker Desktop installiert
- Git Repository geklont
- Node.js 20+ installiert

### Setup Schritte

#### 1. PostgreSQL mit Docker starten

```bash
# PostgreSQL Container starten
docker-compose up -d

# Status prüfen
docker-compose ps

# Logs anzeigen
docker-compose logs -f
```

PostgreSQL läuft nun auf: `localhost:5432`

#### 2. Backend .env konfigurieren

Erstelle `backend/.env`:

```env
DATABASE_URL=postgresql://charakter:CharakterDev2026@localhost:5432/charakter_db
JWT_SECRET=dein-geheimer-schluessel-hier
PORT=3000
NODE_ENV=development
```

#### 3. Dependencies installieren

```bash
cd backend
npm install
```

#### 4. Datenbank Schema erstellen

```bash
npm run db:migrate
```

#### 5. (Optional) Daten von SQLite migrieren

```bash
npm run db:migrate-from-sqlite
```

#### 6. Backend starten

```bash
npm run dev
```

### Nützliche Docker Befehle

```bash
# PostgreSQL stoppen
docker-compose down

# PostgreSQL + Daten löschen
docker-compose down -v

# PostgreSQL Console öffnen
docker-compose exec postgres psql -U charakter -d charakter_db

# Datenbank neu aufsetzen
docker-compose down -v
docker-compose up -d
npm run db:migrate
```

---

## 🖥️ Production Setup auf Ubuntu Server

### Voraussetzungen
- Ubuntu Server 20.04+ oder 22.04 LTS
- Root/sudo Zugriff
- Mindestens 2GB RAM
- 10GB freier Speicher

### Vollautomatische Installation

```bash
# 1. Repository zum Server kopieren
scp -r charakter_creation user@server:/tmp/

# 2. Auf Server einloggen
ssh user@server

# 3. Install-Script ausführen
cd /tmp/charakter_creation
chmod +x install-ubuntu-production.sh
sudo ./install-ubuntu-production.sh
```

Das Script installiert automatisch:
- ✅ PostgreSQL 14
- ✅ Node.js 20 LTS
- ✅ PM2 Process Manager
- ✅ nginx Reverse Proxy
- ✅ Firewall Konfiguration
- ✅ Automatische Backups
- ✅ SSL Vorbereitung

### Nach der Installation

#### 1. .env File erstellen

```bash
sudo su - charakter
cd /opt/charakter-creation
cp .env.template backend/.env

# .env anpassen (vi/nano)
nano backend/.env
```

#### 2. Code deployen

Von deinem lokalen PC:

```bash
# deploy.sh anpassen (SERVER_HOST eintragen)
nano deploy.sh

# Deployen
./deploy.sh production
```

#### 3. SSL Zertifikat einrichten

```bash
# Auf dem Server
sudo certbot --nginx -d yourdomain.com
```

---

## 📦 Daten-Migration von SQLite

### Automatische Migration

Migriert automatisch alle Daten von SQLite zu PostgreSQL:

```bash
cd backend

# Migration durchführen
tsx src/database/migrate-sqlite-to-postgres.ts
```

Das Script:
- ✅ Liest alle Daten aus `database.sqlite`
- ✅ Erstellt PostgreSQL Schema
- ✅ Konvertiert Datentypen
- ✅ Schreibt Daten nach PostgreSQL
- ✅ Verifiziert die Migration

### Manuelle Migration

Falls du die Migration manuell durchführen möchtest:

```bash
# 1. SQLite Dump erstellen
sqlite3 database.sqlite .dump > backup.sql

# 2. Für PostgreSQL anpassen
# (Type Conversions, AUTOINCREMENT → SERIAL, etc.)

# 3. In PostgreSQL importieren
psql -U charakter -d charakter_db -f backup_converted.sql
```

---

## 🚀 Deployment

### Automatisches Deployment

```bash
# Von deinem lokalen PC

# Production
./deploy.sh production

# Staging (falls konfiguriert)
./deploy.sh staging
```

### Was das Deployment-Script macht:

1. ✅ Prüft Git Status
2. ✅ Baut Backend & Frontend
3. ✅ Erstellt Backup auf Server
4. ✅ Transferred Files via rsync
5. ✅ Installiert Dependencies
6. ✅ Startet App mit PM2 neu
7. ✅ Führt Health Check durch

### Manuelles Deployment

```bash
# 1. Lokal bauen
cd backend && npm run build
cd ../frontend && npm run build

# 2. Zum Server kopieren
rsync -avz backend/dist user@server:/opt/charakter-creation/backend/
rsync -avz frontend/dist user@server:/opt/charakter-creation/frontend/

# 3. Auf Server: PM2 Neustart
ssh user@server
pm2 reload charakter-backend
```

---

## 🔧 Troubleshooting

### PostgreSQL Connection Fehler

**Problem:** `ECONNREFUSED` oder `Connection refused`

**Lösung:**
```bash
# Docker: Prüfen ob Container läuft
docker-compose ps

# Ubuntu: Prüfen ob PostgreSQL läuft
sudo systemctl status postgresql

# Connection String prüfen
echo $DATABASE_URL
```

### TypeScript Compilation Fehler

**Problem:** TypeScript findet `pg` Types nicht

**Lösung:**
```bash
cd backend
npm install @types/pg --save-dev
npm run build
```

### Migration Fehler

**Problem:** Foreign Key Constraint Violations

**Lösung:**
```sql
-- Temporär Foreign Keys deaktivieren
SET session_replication_role = 'replica';

-- Deine Inserts

-- Foreign Keys wieder aktivieren
SET session_replication_role = 'origin';
```

### PM2 App startet nicht

**Problem:** App crasht sofort nach Start

**Lösung:**
```bash
# Logs anzeigen
pm2 logs charakter-backend

# .env prüfen
cat /opt/charakter-creation/backend/.env

# Manuell testen
cd /opt/charakter-creation/backend
node dist/server.js
```

### nginx 502 Bad Gateway

**Problem:** nginx zeigt 502 Error

**Lösung:**
```bash
# Backend Status prüfen
pm2 status

# Backend läuft nicht? Starten!
pm2 start ecosystem.config.js

# nginx config testen
sudo nginx -t

# nginx neu laden
sudo systemctl reload nginx
```

---

## 📊 Nützliche Befehle

### Docker

```bash
docker-compose up -d          # Start
docker-compose down           # Stop
docker-compose logs -f        # Logs
docker-compose exec postgres psql -U charakter -d charakter_db  # Console
```

### PM2 (auf Server)

```bash
pm2 status                    # Status
pm2 logs                      # Logs
pm2 restart charakter-backend # Neustart
pm2 monit                     # Live Monitoring
pm2 flush                     # Logs löschen
```

### PostgreSQL

```bash
# Console öffnen
psql -U charakter -d charakter_db

# Alle Tabellen anzeigen
\dt

# Tabellen-Struktur anzeigen
\d users

# Query ausführen
SELECT COUNT(*) FROM users;

# Backup erstellen
pg_dump -U charakter charakter_db > backup.sql

# Backup wiederherstellen
psql -U charakter -d charakter_db < backup.sql
```

---

## 🔐 Sicherheit

### Production Checklist

- [ ] PostgreSQL nur über localhost erreichbar
- [ ] Starkes DB-Passwort (32+ Zeichen)
- [ ] JWT_SECRET mit 64+ Zeichen
- [ ] SSL Zertifikat installiert (Let's Encrypt)
- [ ] Firewall konfiguriert (nur 80, 443, SSH)
- [ ] Automatische Backups aktiviert
- [ ] Logs werden rotiert
- [ ] Updates automatisch installiert

---

## 📚 Weiterführende Ressourcen

- [PostgreSQL Dokumentation](https://www.postgresql.org/docs/)
- [PM2 Dokumentation](https://pm2.keymetrics.io/docs/)
- [nginx Dokumentation](https://nginx.org/en/docs/)
- [Docker Compose Dokumentation](https://docs.docker.com/compose/)

---

## 🆘 Support

Bei Problemen:

1. Prüfe die Logs (`pm2 logs`, `docker-compose logs`)
2. Verifiziere die .env Konfiguration
3. Teste die Datenbank-Verbindung manuell
4. Prüfe Firewall-Regeln

**Backup wiederherstellen:**

```bash
# Git zurücksetzen
git checkout v1.0-sqlite-stable

# SQLite Backup wiederherstellen
cp backend/database.sqlite.backup-TIMESTAMP backend/database.sqlite

# Backend neu bauen
cd backend && npm run build

# Starten
npm start
```

---

**Stand:** Januar 2026  
**Version:** 2.0 (PostgreSQL)  
**Vorherige Version:** 1.0 (SQLite) - Tag: `v1.0-sqlite-stable`
