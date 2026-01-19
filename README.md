# 🎮 Charakter Creation System

Ein RPG-inspiriertes Gamification-System für Fachinformatiker Auszubildende. Entwickle deinen IT-Charakter durch Quests, sammle Achievements und steige im Level auf!

## ✨ Features

- **RPG-Charaktersystem** mit IT-spezifischen Attributen (Programmierung, Netzwerke, Datenbanken, Hardware, Sicherheit, Projektmanagement)
- **Quest-System** mit verschiedenen Schwierigkeitsgraden und Kategorien
- **Achievements & Belohnungen** zum Freischalten
- **Ausrüstungssystem** mit verschiedenen Raritätsstufen
- **Leaderboards** zum Vergleichen mit anderen
- **Level-System** von 1-99 mit XP-Progression

## 🛠️ Tech Stack

**Backend:** Node.js, Express, TypeScript, SQLite  
**Frontend:** React, TypeScript, Vite, Tailwind CSS

## 📋 Voraussetzungen

- Node.js (v18 oder höher)
- npm

## 🚀 Lokale Installation

### 1. Repository klonen
```bash
git clone <repository-url>
cd charakter_creation
```

### 2. Backend einrichten
```bash
cd backend
npm install
```

Erstelle eine `.env` Datei im `backend/` Ordner:
```env
DATABASE_URL=./database.sqlite
PORT=3000
NODE_ENV=development
JWT_SECRET=change-this-to-secure-random-string
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Frontend einrichten
```bash
cd ../frontend
npm install
```

Erstelle eine `.env` Datei im `frontend/` Ordner:
```env
VITE_API_URL=http://localhost:3000
```

### 4. Datenbank initialisieren
```bash
cd ../backend
npm run db:migrate
npm run db:setup-admin
npm run db:seed  # Optional: Beispieldaten
```

### 5. Anwendung starten

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Die Anwendung ist dann verfügbar unter **http://localhost:5173**

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
- Für Production-Deployment siehe `DEPLOYMENT.md`

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
