# 🎮 Installations-Anleitung für Charakter Creation

## 📖 Über dieses Dokument

Willkommen, angehender Akademie-Gründer! Diese Anleitung erklärt Schritt für Schritt, wie du deine eigene **Charakter Creation Akademie** aufbaust. Keine Sorge - auch wenn du kein IT-Experte bist, wirst du alles verstehen können.

Stell dir vor, du baust ein Haus: Du brauchst ein Fundament, Wände, ein Dach und Möbel. Genau so bauen wir auch diese Anwendung auf!

---

## 🗺️ Die Große Übersicht - Was passiert bei der Installation?

Die Installation durchläuft **mehrere Quests** (Aufgaben), die nacheinander erledigt werden:

```
1. Das Fundament prüfen          → Sind alle benötigten Programme da?
2. Die Akademie errichten        → Ordner und Benutzer anlegen
3. Die Runen gravieren           → Einstellungen konfigurieren
4. Bibliotheken sammeln          → Zusätzliche Programme installieren
5. Portal erschaffen             → Die Webseite bauen
6. Datenbank erstellen           → Speicher für alle Daten anlegen
7. Wächter beschwören            → Dienste starten, die dauerhaft laufen
8. Torwächter aufstellen         → Webserver einrichten
9. Dienste erwecken              → Alles starten!
```

---

## ⚙️ Was du brauchst (Systemanforderungen)

### 🖥️ Hardware (Dein Computer/Server)

- **Prozessor:** Mindestens 2 Kerne (moderne Computer haben meist 4 oder mehr)
- **Arbeitsspeicher (RAM):** Mindestens 2 GB (besser 4 GB)
- **Festplatte:** Mindestens 2 GB freier Speicherplatz
- **Internet:** Für den Download der benötigten Programme

### 🐧 Software (Betriebssystem)

- **Linux-Server** (Ubuntu 20.04 oder neuer wird empfohlen)
- **Root-Zugriff** (Administrator-Rechte auf dem Server)

> 💡 **Was ist Root?** Das ist wie der "Administrator" unter Windows. Du brauchst diese Rechte, um Programme zu installieren und das System zu konfigurieren.

---

## 🎯 Die Quests im Detail

### Quest 1: Das Fundament prüfen

**Was passiert hier?**

Das Script prüft, ob alle benötigten Grundprogramme auf deinem Server installiert sind.

#### 🔍 Geprüfte Programme:

##### 1. **Node.js** (Die Zaubersprache)

- **Was ist das?** Node.js ist wie ein Übersetzer. Es ermöglicht, dass der Server deine Anwendung versteht und ausführen kann.
- **Warum wichtig?** Ohne Node.js kann deine Anwendung nicht laufen.
- **Version:** Wir brauchen Version 20 oder neuer.
- **Was macht das Script?** 
  - Prüft, ob Node.js installiert ist
  - Falls nicht → lädt und installiert es automatisch
  - Zeigt die installierte Version an

```bash
# Das passiert im Hintergrund:
node -v  # Zeigt Version: z.B. v20.11.0
```

##### 2. **npm** (Der Paketmanager)

- **Was ist das?** npm ist wie ein App-Store für Programme. Es verwaltet alle zusätzlichen Tools, die deine App braucht.
- **Warum wichtig?** Damit können wir hunderte kleine Hilfsprogramme automatisch installieren.
- **Kommt mit:** Node.js (wird automatisch mitinstalliert)

##### 3. **SQLite3** (Die Bibliothek des Wissens)

- **Was ist das?** Eine Datenbank - ein Ort, wo alle Informationen gespeichert werden (Benutzer, Charaktere, Quests, etc.)
- **Warum wichtig?** Ohne Datenbank hätten wir keinen Speicher für die Spielerdaten.
- **Besonderheit:** SQLite ist sehr einfach - keine komplexe Installation nötig!

---

### Quest 2: Die Akademie errichten

**Was passiert hier?**

Wir erstellen einen speziellen Ort auf dem Server, wo unsere Anwendung "wohnt".

#### 📁 Ordnerstruktur:

```
/opt/charakter-creation/         ← Hauptverzeichnis
├── backend/                     ← Server-Teil (API)
│   ├── src/                     ← Quellcode
│   ├── dist/                    ← Kompilierter Code
│   └── database.sqlite          ← Die Datenbank-Datei
└── frontend/                    ← Website-Teil
    ├── src/                     ← Quellcode
    └── dist/                    ← Fertige Webseite
```

#### 👤 Der Wächter-Benutzer

- **Name:** `charakter`
- **Was ist das?** Ein spezieller Benutzer, der nur für diese Anwendung existiert
- **Warum?** Aus Sicherheitsgründen! Wenn ein Hacker die Anwendung angreift, kann er nicht den ganzen Server übernehmen.

**Wichtig zu wissen:**
- Der Benutzer kann sich nicht einloggen (hat kein Passwort)
- Er darf nur die Anwendung starten und verwalten
- Alle Dateien gehören ihm

---

### Quest 3: Die Runen gravieren

**Was passiert hier?**

Wir erstellen Konfigurationsdateien (`.env` Dateien) mit wichtigen Einstellungen.

#### 🔐 Backend-Runen (`backend/.env`)

```env
DATABASE_URL=./database.sqlite      # Wo ist die Datenbank?
PORT=3000                           # Auf welchem Port läuft der Server?
NODE_ENV=production                 # Produktionsmodus (nicht Entwicklung)
JWT_SECRET=xyz123...                # Geheimer Schlüssel für Login-Sicherheit
ALLOWED_ORIGINS=http://...          # Welche Webseiten dürfen zugreifen?
LOG_LEVEL=info                      # Wie viele Infos sollen geloggt werden?
```

**Was bedeutet das?**

- **DATABASE_URL:** Wie ein Pfeil, der auf die Datenbank zeigt
- **PORT:** Wie eine Hausnummer - Server lauscht auf Port 3000
- **NODE_ENV:** Sagt dem Server "Wir sind live!" (keine Debug-Infos)
- **JWT_SECRET:** Ein super-geheimer Schlüssel (wie ein Passwort für Cookies)
- **ALLOWED_ORIGINS:** Sicherheit - nur erlaubte Webseiten dürfen Daten abrufen

> 🔒 **Sicherheit:** Der JWT_SECRET wird automatisch zufällig generiert - niemand kann ihn erraten!

#### 🌐 Frontend-Runen (`frontend/.env`)

```env
VITE_API_URL=http://192.168.1.100:3000    # Wo ist das Backend?
```

**Was bedeutet das?**

- Die Webseite muss wissen, wo der Server ist
- Die IP-Adresse wird automatisch erkannt
- Port 3000 = wo das Backend lauscht

---

### Quest 4: Die heiligen Bibliotheken sammeln

**Was passiert hier?**

Wir installieren hunderte kleine Hilfsprogramme, die unsere App braucht.

#### 📚 Backend-Bibliotheken

```bash
cd backend/
npm install --production
```

**Was wird installiert?**

- **Express:** Der Webserver (nimmt Anfragen entgegen)
- **SQLite3:** Datenbankanbindung
- **JWT:** Für sichere Logins
- **Bcrypt:** Verschlüsselt Passwörter
- **Cors:** Erlaubt Browser-Zugriffe
- ...und viele mehr

> 💡 **Analogie:** Stell dir vor, du baust ein Auto. Du kaufst nicht alle Einzelteile selbst - du bestellst fertige Komponenten (Motor, Reifen, etc.). Genau das macht `npm install`.

**Warum `--production`?**

- Installiert nur, was wirklich gebraucht wird
- Entwickler-Tools werden weggelassen
- Spart Speicherplatz und Zeit

#### 🎨 Frontend-Bibliotheken

```bash
cd frontend/
npm install
```

**Was wird installiert?**

- **React:** Das Framework für die Webseite
- **TypeScript:** Macht den Code sicherer
- **Vite:** Baut die Webseite zusammen
- **Tailwind CSS:** Macht die Seite hübsch
- **Axios:** Kommuniziert mit dem Backend
- ...und viele mehr

---

### Quest 5: Die Portalmagie weben (Frontend Build)

**Was passiert hier?**

Die Webseite wird "gebaut" - aus vielen kleinen Dateien wird eine optimierte Version.

```bash
cd frontend/
npm run build
```

#### 🔨 Was bedeutet "Build"?

**Vorher:**
```
src/
├── App.tsx          (100 KB)
├── Page1.tsx        (50 KB)
├── Page2.tsx        (50 KB)
├── Component1.tsx   (20 KB)
├── Component2.tsx   (20 KB)
└── ... (50+ Dateien)
```

**Nachher:**
```
dist/
├── index.html       (2 KB)
├── assets/
│   ├── index-abc123.js    (150 KB, komprimiert!)
│   └── index-xyz789.css   (30 KB, komprimiert!)
```

**Was passiert beim Build?**

1. **Zusammenfügen:** Alle Dateien werden kombiniert
2. **Minimieren:** Leerzeichen und Kommentare werden entfernt
3. **Optimieren:** Code wird schneller gemacht
4. **Komprimieren:** Dateien werden kleiner

**Warum wichtig?**

- ⚡ Webseite lädt viel schneller
- 📦 Weniger Datenverbrauch
- 🔒 Quellcode ist nicht lesbar (Schutz)

---

### Quest 6: Die Backend-Magie kompilieren

**Was passiert hier?**

Der TypeScript-Code wird in JavaScript umgewandelt.

```bash
npx tsc
```

#### 📝 TypeScript → JavaScript

**Was ist TypeScript?**

- Eine erweiterte Version von JavaScript
- Fügt "Typen" hinzu (String, Number, etc.)
- Findet Fehler schon beim Schreiben
- Muss umgewandelt werden, damit Node.js es versteht

**Beispiel:**

```typescript
// TypeScript (src/server.ts)
function addNumbers(a: number, b: number): number {
    return a + b;
}
```

```javascript
// JavaScript (dist/server.js)
function addNumbers(a, b) {
    return a + b;
}
```

**Warum wichtig?**

- Node.js kann nur JavaScript ausführen
- TypeScript macht den Code sicherer
- Kompilierung findet Fehler vor dem Start

---

### Quest 7: Die Datenbank der Weisen erschaffen

**Was passiert hier?**

Die Datenbank wird angelegt und mit Tabellen gefüllt.

#### 🗃️ Datenbank-Migration

```bash
node dist/database/migrate.js
```

**Was ist eine Migration?**

Eine Migration erstellt die "Schubladen" in der Datenbank.

**Tabellen die erstellt werden:**

| Tabelle | Zweck |
|---------|-------|
| `users` | Alle Benutzer (Spieler, Dozenten, Admins) |
| `characters` | Die IT-Charaktere der Spieler |
| `quests` | Alle verfügbaren Aufgaben |
| `submissions` | Abgaben von Spielern |
| `achievements` | Erfolge/Auszeichnungen |
| `equipment` | Items (Ausrüstung) |
| `inventory` | Wer hat welches Item? |
| `notifications` | Benachrichtigungen |
| `groups` | Gruppen/Klassen |
| `leaderboards` | Bestenlisten |

**Analogie:**

Stell dir ein Archiv vor:
- Jede Tabelle = ein Aktenschrank
- Jede Zeile = ein Dokument
- Jede Spalte = ein Feld im Dokument (Name, Adresse, etc.)

#### 👑 Super-Admin erstellen

```bash
node dist/database/setup-admin.js
```

**Was passiert?**

Das Script fragt interaktiv nach:

1. **Benutzername:** z.B. "admin" oder "max_mustermann"
2. **E-Mail:** z.B. "admin@schule.de"
3. **Passwort:** Ein sicheres Passwort
4. **Passwort bestätigen:** Nochmal eingeben

**Was ist ein Super-Admin?**

- Hat **alle** Rechte im System
- Kann andere Admins/Dozenten erstellen
- Kann Quests anlegen und verwalten
- Kann alle Charaktere sehen
- Kann Statistiken einsehen

> ⚠️ **Wichtig:** Notiere dir diese Login-Daten gut! Du brauchst sie, um dich das erste Mal einzuloggen.

#### 🌱 Seed-Daten (Optional)

```bash
node dist/database/seed.js
```

**Was macht das?**

Fügt Beispieldaten hinzu:
- 🎯 20 Test-Quests
- 👥 5 Beispiel-Charaktere
- 🏆 10 Achievements
- ⚔️ 15 Items/Ausrüstung

**Warum?**

- Zum Testen der Anwendung
- Um zu sehen, wie alles aussieht
- Kannst du später löschen oder behalten

---

### Quest 8: Die Wächter-Dienste beschwören

**Was passiert hier?**

Ein dauerhafter Dienst (Service) wird erstellt, der immer läuft.

#### 🛡️ Systemd-Service

```bash
# Service-Datei wird erstellt:
/etc/systemd/system/charakter-backend.service
```

**Was ist ein Systemd-Service?**

- Ein Programm, das automatisch startet
- Läuft im Hintergrund (wie ein Dienst in Windows)
- Startet neu, wenn es abstürzt
- Startet automatisch beim Server-Neustart

**Die Service-Datei erklärt:**

```ini
[Unit]
Description=Charakter Creation Backend    # Name des Dienstes
After=network.target                      # Startet nach Netzwerk

[Service]
Type=simple                               # Einfacher Dienst-Typ
User=charakter                            # Läuft als "charakter"-Benutzer
WorkingDirectory=/opt/charakter-creation/backend
Environment=NODE_ENV=production           # Produktionsmodus
ExecStart=/usr/bin/node dist/server.js    # Befehl zum Starten
Restart=on-failure                        # Bei Absturz neu starten
RestartSec=10                             # Warte 10 Sek. vor Neustart
StandardOutput=journal                    # Logs in System-Journal
StandardError=journal                     # Fehler in System-Journal

[Install]
WantedBy=multi-user.target                # Startet beim Systemstart
```

**Befehle zum Verwalten:**

```bash
# Dienst starten
systemctl start charakter-backend

# Dienst stoppen
systemctl stop charakter-backend

# Dienst neu starten
systemctl restart charakter-backend

# Status prüfen
systemctl status charakter-backend

# Logs anschauen
journalctl -u charakter-backend -f
```

---

### Quest 9: Den Torwächter aufstellen (Nginx)

**Was passiert hier?**

Nginx wird installiert und als Reverse-Proxy konfiguriert.

#### 🚪 Was ist Nginx?

**Analogie:** Nginx ist wie ein Empfangssekretär in einem Bürogebäude.

- **Besucher kommt:** Browser ruft http://dein-server.de auf
- **Empfang entscheidet:** 
  - Ist das eine normale Webseite? → Zeige Frontend (HTML/CSS/JS)
  - Ist das eine API-Anfrage? → Leite zu Backend weiter (Port 3000)
- **Besucher erhält:** Die richtige Antwort

**Warum brauchen wir das?**

1. **Ein Eingang:** Browser spricht nur Port 80 (HTTP) an
2. **Zwei Systeme:** Frontend (statische Dateien) + Backend (API auf Port 3000)
3. **Nginx verbindet beide:** Leitet Anfragen intelligent weiter

#### ⚙️ Die Nginx-Konfiguration

```nginx
server {
    listen 80;                              # Höre auf Port 80 (HTTP)
    server_name _;                          # Akzeptiere alle Domains

    # Frontend - Normale Webseiten-Aufrufe
    location / {
        root /opt/charakter-creation/frontend/dist;
        try_files $uri $uri/ /index.html;    # Single-Page-App Routing
        add_header Cache-Control "no-cache"; # Keine Browser-Zwischenspeicherung
    }

    # Backend API - Anfragen mit /api/
    location /api/ {
        proxy_pass http://localhost:3000/;   # Leite zu Backend weiter
        proxy_set_header Host $host;         # Sende Original-Host mit
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static Assets - Bilder, CSS, JS
    location ~* \.(jpg|png|css|js|svg|woff)$ {
        root /opt/charakter-creation/frontend/dist;
        expires 1y;                          # 1 Jahr im Cache
        add_header Cache-Control "public, immutable";
    }
}
```

**Beispiel-Fluss:**

```
Browser                 Nginx                    Backend/Frontend
   |                      |                           |
   |--GET / ------------->|                           |
   |                      |--Datei: index.html ------>|
   |<--HTML Code----------|<--------------------------|
   |                      |                           |
   |--GET /api/quests---->|                           |
   |                      |--Weiterleiten------------>|
   |                      |                 (Port 3000)|
   |<--JSON Data----------|<--------------------------|
```

---

### Quest 10: Dienste erwecken

**Was passiert hier?**

Alle Dienste werden gestartet und für automatischen Start konfiguriert.

```bash
systemctl daemon-reload              # Lade neue Service-Dateien
systemctl enable charakter-backend   # Aktiviere Autostart
systemctl start charakter-backend    # Starte Backend
systemctl restart nginx              # Starte Nginx neu
```

**Was bedeutet das?**

- **daemon-reload:** "Hey System, es gibt neue Dienste!"
- **enable:** "Starte beim Hochfahren automatisch"
- **start:** "Starte jetzt sofort"
- **restart:** "Nginx neu starten mit neuer Config"

---

## 🎊 Nach der Installation

### ✅ Prüfe ob alles läuft

```bash
# Backend-Status
sudo systemctl status charakter-backend
# Sollte zeigen: active (running)

# Nginx-Status
sudo systemctl status nginx
# Sollte zeigen: active (running)
```

### 🌐 Greife auf die Akademie zu

1. Finde die IP-Adresse deines Servers:
   ```bash
   ip addr show
   # Oder
   hostname -I
   ```

2. Öffne im Browser:
   ```
   http://DEINE-SERVER-IP
   ```

3. Du siehst die Login-Seite!

4. Logge dich ein mit den Admin-Daten, die du vorhin erstellt hast

---

## 🔧 Wartung und Verwaltung

### 📊 Logs anschauen

**Backend-Logs (Live):**
```bash
sudo journalctl -u charakter-backend -f
```
- Zeigt alles, was das Backend macht
- `-f` bedeutet "follow" (live Aktualisierung)
- Beenden mit `Strg + C`

**Backend-Logs (letzte 100 Zeilen):**
```bash
sudo journalctl -u charakter-backend -n 100
```

**Nginx-Fehler-Logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Nginx-Zugriffs-Logs:**
```bash
sudo tail -f /var/log/nginx/access.log
```

### 🔄 Dienste neu starten

**Backend neu starten:**
```bash
sudo systemctl restart charakter-backend
```

**Wann nötig?**
- Nach Änderungen an `.env` Datei
- Nach Updates
- Bei Problemen

**Nginx neu starten:**
```bash
sudo systemctl restart nginx
```

**Wann nötig?**
- Nach Config-Änderungen
- Bei Problemen mit Webseite

### 🛑 Dienste stoppen

```bash
sudo systemctl stop charakter-backend
sudo systemctl stop nginx
```

### ▶️ Dienste starten

```bash
sudo systemctl start charakter-backend
sudo systemctl start nginx
```

---

## 🔒 Sicherheit

### Firewall konfigurieren

```bash
# UFW (Uncomplicated Firewall)
sudo ufw allow 'Nginx Full'    # HTTP + HTTPS
sudo ufw allow ssh              # SSH-Zugriff
sudo ufw enable                 # Aktiviere Firewall
```

### Backups erstellen

**Datenbank sichern:**
```bash
cd /opt/charakter-creation/backend
sudo -u charakter cp database.sqlite database.sqlite.backup
```

**Automatisches Backup (täglich):**
```bash
# Crontab bearbeiten
sudo crontab -e

# Füge hinzu (jeden Tag um 3 Uhr nachts):
0 3 * * * cp /opt/charakter-creation/backend/database.sqlite \
          /opt/charakter-creation/backend/backup-$(date +\%Y\%m\%d).sqlite
```

---

## ❓ Problemlösung

### Problem: Backend startet nicht

**Prüfen:**
```bash
# Status checken
sudo systemctl status charakter-backend

# Logs anschauen
sudo journalctl -u charakter-backend -n 50
```

**Häufige Ursachen:**

1. **Port bereits belegt:**
   ```bash
   # Prüfe was auf Port 3000 läuft
   sudo lsof -i :3000
   ```

2. **Dateiberechtigungen:**
   ```bash
   # Stelle sicher, dass "charakter" Besitzer ist
   sudo chown -R charakter:charakter /opt/charakter-creation
   ```

3. **`.env` Datei fehlt:**
   ```bash
   # Prüfe ob vorhanden
   ls -la /opt/charakter-creation/backend/.env
   ```

### Problem: Webseite lädt nicht

**Prüfen:**
```bash
# Nginx Status
sudo systemctl status nginx

# Nginx Config testen
sudo nginx -t

# Fehler-Logs
sudo tail -f /var/log/nginx/error.log
```

### Problem: Login funktioniert nicht

**Prüfen:**

1. **Backend erreichbar?**
   ```bash
   curl http://localhost:3000/health
   ```
   Sollte antworten mit Status-Info

2. **CORS-Problem?**
   - Öffne Browser-Entwicklertools (F12)
   - Schaue in Console nach Fehlern
   - Prüfe `.env` Datei: `ALLOWED_ORIGINS`

3. **Admin-Benutzer existiert?**
   ```bash
   cd /opt/charakter-creation/backend
   sudo -u charakter sqlite3 database.sqlite "SELECT * FROM users WHERE role='admin';"
   ```

---

## 🚀 Nächste Schritte

Nach erfolgreicher Installation:

1. **📝 Erste Schritte:**
   - Logge dich als Admin ein
   - Erstelle einen Dozenten-Account
   - Lege erste Quests an

2. **👥 Benutzer hinzufügen:**
   - Dozenten können Schüler-Accounts erstellen
   - Oder: Selbst-Registrierung aktivieren (falls gewünscht)

3. **🎯 Quests erstellen:**
   - Gehe zu "Quest Management"
   - Erstelle IT-spezifische Aufgaben
   - Weise Punkte und Kategorien zu

4. **🎨 Anpassen:**
   - Logo austauschen
   - Farben anpassen (Tailwind CSS)
   - Eigene Texte einfügen

---

## 📚 Glossar

| Begriff | Erklärung |
|---------|-----------|
| **Backend** | Der Server-Teil, der die Logik verwaltet |
| **Frontend** | Die Webseite, die der Benutzer sieht |
| **API** | Schnittstelle zwischen Frontend und Backend |
| **Port** | Eine "Hausnummer" für Netzwerk-Dienste |
| **Proxy** | Vermittler, der Anfragen weiterleitet |
| **Service/Dienst** | Programm, das dauerhaft im Hintergrund läuft |
| **Migration** | Datenbank-Struktur erstellen/ändern |
| **Seed** | Beispieldaten in Datenbank einfügen |
| **npm** | Paketmanager für JavaScript |
| **Node.js** | JavaScript-Laufzeitumgebung für Server |
| **TypeScript** | JavaScript mit Typ-System |
| **Build** | Zusammenfügen und Optimieren von Code |
| **Root** | Administrator-Account mit allen Rechten |

---

## 🎉 Herzlichen Glückwunsch!

Du hast es geschafft! Deine Charakter Creation Akademie steht und ist bereit, angehende Fachinformatiker auf ihrer Reise zu begleiten.

**Möge deine Akademie viele erfolgreiche Helden hervorbringen!** ⚔️🎮

---

## 📞 Support

Bei Problemen oder Fragen:

1. Schaue in die Logs (siehe oben)
2. Prüfe die Troubleshooting-Sektion
3. Dokumentiere den Fehler genau
4. Kontaktiere deinen IT-Support

**Viel Erfolg auf deiner Reise! 🚀**
