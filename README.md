# 🎮 Charakter Creation System

Ein RPG-inspiriertes Gamification-System für Fachinformatiker Auszubildende. Entwickle deinen IT-Charakter durch Quests, sammle Achievements und steige im Level auf!

## ✨ Features

- **RPG-Charaktersystem** mit IT-spezifischen Attributen (Programmierung, Netzwerke, Datenbanken, Hardware, Sicherheit, Projektmanagement)
- **Quest-System** mit verschiedenen Schwierigkeitsgraden und Kategorien
- **Achievements & Belohnungen** zum Freischalten
- **Ausrüstungssystem** mit verschiedenen Raritätsstufen
- **Leaderboards** zum Vergleichen mit anderen
- **Level-System** von 1-50 mit XP-Progression

## 🛠️ Tech Stack

**Backend:** Node.js, Express, TypeScript, SQLite  
**Frontend:** React, TypeScript, Vite, Tailwind CSS

## � Installation

### Für Entwickler (Lokal)

Für die lokale Entwicklung und zum Testen:

1. **Repository klonen:**
   ```bash
   git clone https://github.com/idA-134/charakter-creator.git
   cd charakter-creator
   ```

2. **Schnellstart:**
   ```bash
   # Backend einrichten
   cd backend
   npm install
   cp .env.example .env  # Konfiguration anpassen
   npm run db:migrate
   npm run db:setup-admin
   npm run dev
   
   # Frontend einrichten (neues Terminal)
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

3. **Öffne im Browser:** http://localhost:5173

### Für Server-Deployment (Linux)

Für die Installation auf einem Linux-Server:

**📖 Siehe die ausführliche [Installations-Anleitung](INSTALLATIONS-ANLEITUNG.md)**

Die Anleitung erklärt Schritt für Schritt:
- ✅ Alle benötigten Voraussetzungen
- ✅ Was jeder Schritt genau macht
- ✅ Verständlich auch für Nicht-Informatiker
- ✅ Wartung und Problemlösung
- ✅ Sicherheitshinweise

**Automatisches Installations-Script:**
```bash
sudo ./install.sh
```
Das spielerische Script führt dich durch die komplette Installation! 🎮

## 📁 Projektstruktur

```
charakter_creation/
├── backend/          # Express API Server
│   ├── src/
│   │   ├── database/ # Datenbank & Migrationen
│   │   ├── routes/   # API Routes
│   │   └── types/    # TypeScript Definitionen
│   └── package.json
├── frontend/         # React Anwendung
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── README.md
```

## 🔧 NPM Scripts

### Backend
```bash
npm run dev              # Entwicklungsserver starten
npm run build            # Für Production kompilieren
npm run db:migrate       # Datenbank erstellen
npm run db:setup-admin   # Admin-Account einrichten
npm run db:seed          # Beispieldaten hinzufügen
```

### Frontend
```bash
npm run dev     # Entwicklungsserver
npm run build   # Production Build
```

## 🎮 Verwendung

1. Registriere einen Account (nur Username und Passwort erforderlich)
2. Erstelle deinen ersten Charakter
3. Wähle Quests aus und sammle XP
4. Schalte Achievements frei
5. Steige im Level auf und verbessere deine Attribute

## 📝 Hinweise

- Keine E-Mail-Adressen erforderlich
- Alle Daten werden lokal gespeichert
- Passwörter werden sicher gehasht
- Für Production-Deployment siehe [INSTALLATIONS-ANLEITUNG.md](INSTALLATIONS-ANLEITUNG.md)

## 🔒 Sicherheit

Vor dem Deployment in Production:
- ✅ Ändere `JWT_SECRET` zu einem sicheren, zufälligen String
- ✅ Verwende HTTPS
- ✅ Setze `NODE_ENV=production`
- ✅ Erstelle regelmäßige Backups

## 📄 Lizenz

Dieses Projekt wurde für Ausbildungszwecke erstellt.

## 💡 Mitwirken

Feedback und Verbesserungsvorschläge sind willkommen!
- [ ] Team/Gilden-System
- [ ] Wöchentliche Challenges
- [ ] Skill-Trees
- [ ] PvP-Challenges (Code-Duelle)
- [ ] Export/Import von Charakteren
- [ ] Statistik-Dashboard
- [ ] Notifications bei neuen Achievements
- [ ] Dark Mode

## 📞 Support

Bei Fragen oder Problemen erstelle ein Issue im Repository.

---

Viel Spaß beim Leveln! 🚀
