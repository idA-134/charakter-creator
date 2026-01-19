# ✅ GitHub Upload Checkliste

## 🎯 Vor dem ersten Git Push

### ✅ Erledigt: `.gitignore` ist konfiguriert

Die `.gitignore` Datei schützt folgende sensible Dateien:

- ✅ `.env` Dateien (enthalten Secrets!)
- ✅ `*.sqlite` Datenbanken (enthalten Benutzerdaten!)
- ✅ `node_modules/` (zu groß, wird eh neu installiert)
- ✅ `dist/` und `build/` Ordner (werden neu generiert)
- ✅ Log-Dateien
- ✅ IDE-Konfigurationen (.vscode, .idea)

### ✅ Generische Pfade in Dokumentation

Alle Pfade in den Dokumenten sind generisch:
- ✅ `/opt/charakter-creation` (Linux-Server-Pfad, kein persönlicher Pfad)
- ✅ Kein `C:\Users\mario` in Dateien
- ✅ Beispiel-Domains und IPs verwendet

### ✅ Beispiel-Konfigurationen vorhanden

- ✅ `.env.example` Dateien sind vorhanden (ohne Secrets)
- ✅ Dokumentation verweist auf Beispieldateien

---

## 🚀 GitHub Repository erstellen

### Schritt 1: Lokales Git Repository initialisieren

```powershell
cd "c:\Users\mario\Desktop\GitHub\charakter_creation"
git init
git add .
git commit -m "Initial commit: Charakter Creation System 🎮"
```

### Schritt 2: GitHub Repository erstellen

1. Gehe zu https://github.com/new
2. Repository Name: `charakter-creation` oder einen Namen deiner Wahl
3. Beschreibung: "🎮 RPG-basiertes Gamification-System für IT-Auszubildende"
4. Wähle: **Public** oder **Private**
5. **NICHT** "Initialize with README" anklicken (wir haben schon eins!)
6. Klicke "Create repository"

### Schritt 3: Remote hinzufügen und pushen

```powershell
# Ersetze DEIN-GITHUB-BENUTZERNAME mit deinem echten GitHub-Namen
git remote add origin https://github.com/DEIN-GITHUB-BENUTZERNAME/charakter-creation.git

# Branch umbenennen (falls nötig)
git branch -M main

# Hochladen!
git push -u origin main
```

---

## ⚠️ WICHTIG: Was NICHT auf GitHub landet

Diese Dateien werden **automatisch ignoriert** (dank .gitignore):

### 🔒 Sensible Daten:
- `backend/.env` (enthält JWT_SECRET!)
- `backend/database.sqlite` (enthält Benutzerdaten!)
- Alle anderen `.env` Dateien

### 📦 Große/Generierte Dateien:
- `node_modules/` (zu groß, über 200 MB!)
- `dist/` und `build/` Ordner
- Log-Dateien

### 💻 Persönliche Konfigurationen:
- `.vscode/` Ordner
- `.idea/` Ordner

---

## 📋 Was MIT auf GitHub landet

✅ **Quellcode:**
- `backend/src/` - Backend TypeScript Code
- `frontend/src/` - Frontend React Code

✅ **Konfigurationen:**
- `package.json` Dateien
- `tsconfig.json` Dateien
- `tailwind.config.js`
- `.gitignore` selbst

✅ **Dokumentation:**
- `README.md` - Hauptdokumentation
- `INSTALLATIONS-ANLEITUNG.md` - Detaillierte Installationsanleitung
- `DEPLOYMENT.md` - Server-Deployment Guide

✅ **Scripts:**
- `install.sh` - Spielerisches Installationsskript
- `prepare-deploy.sh` / `prepare-deploy.ps1` - Deployment-Vorbereitung
- `update.sh` - Update-Script
- `uninstall.sh` - Deinstallations-Script

✅ **Beispiel-Konfigurationen:**
- `.env.example` Dateien

---

## 🔍 Letzte Prüfung vor dem Push

```powershell
# Zeige alle Dateien die hinzugefügt werden
git status

# Zeige detailliert was in den Dateien steht
git diff --cached

# Falls eine Datei nicht hochgeladen werden soll:
git reset HEAD dateiname

# Falls du sicher bist:
git push
```

---

## 🎓 Nach dem Upload

### Repository-Einstellungen

1. **Topics hinzufügen** (für bessere Auffindbarkeit):
   - `gamification`
   - `education`
   - `rpg`
   - `typescript`
   - `react`
   - `nodejs`
   - `sqlite`

2. **README badges** (optional):
   ```markdown
   ![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
   ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
   ![React](https://img.shields.io/badge/React-18.x-blue)
   ```

3. **License hinzufügen** (optional):
   - Empfehlung: MIT License (sehr permissiv)
   - Oder: GPL-3.0 (Open Source mit Copyleft)

---

## 🔐 Sicherheitshinweise

### ⚠️ Falls du versehentlich Secrets hochgeladen hast:

1. **SOFORT** die Secrets ändern (JWT_SECRET, etc.)
2. **NICHT** einfach die Datei löschen - Git-Historie behält alles!
3. Nutze `git filter-branch` oder BFG Repo-Cleaner:
   ```powershell
   # Installiere BFG
   # Download von: https://rtyley.github.io/bfg-repo-cleaner/
   
   # Entferne Secrets aus Historie
   bfg --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

### 🛡️ Best Practices:

- Ändere `.env` Dateien NIE mehr zurück zu echten Werten im Git
- Nutze GitHub Secrets für CI/CD
- Überprüfe regelmäßig mit `git log --all -- backend/.env`

---

## 📞 Probleme beim Upload?

### Fehler: "Repository not found"
- Prüfe ob du den richtigen GitHub-Benutzernamen verwendet hast
- Prüfe ob das Repository wirklich existiert

### Fehler: "Permission denied"
- Nutze Personal Access Token statt Passwort
- Einstellungen → Developer Settings → Personal Access Tokens

### Fehler: "File too large"
- GitHub Limit: 100 MB pro Datei
- Prüfe ob `node_modules/` ignoriert wird
- Nutze `git lfs` für große Dateien (falls nötig)

---

## 🎉 Fertig!

Dein Repository ist jetzt live auf GitHub! 🚀

**Nächste Schritte:**
- Teile den Link mit deinem Team
- Erstelle Issues für geplante Features
- Nutze GitHub Projects für Projekt-Management
- Erstelle Branches für neue Features

**Repository-URL wird sein:**
```
https://github.com/DEIN-BENUTZERNAME/charakter-creation
```

---

## 📚 Git Cheat Sheet

```powershell
# Status anzeigen
git status

# Änderungen hinzufügen
git add .

# Commit erstellen
git commit -m "Deine Nachricht"

# Pushen
git push

# Pullen (Updates holen)
git pull

# Neuen Branch erstellen
git checkout -b feature/neue-funktion

# Branches anzeigen
git branch

# Branch wechseln
git checkout main
```

---

**Viel Erfolg mit deinem GitHub Repository! 🎮⚔️**
