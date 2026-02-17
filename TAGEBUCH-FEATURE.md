# Tagebuch & Quest-Log Feature

## Übersicht

Das Tagebuch-Feature ermöglicht es Nachwuchskräften (NWK), ihre Lernerfahrungen zu dokumentieren und über abgeschlossene Quests zu reflektieren.

## Features

### 📖 Persönliches Tagebuch

Nachwuchskräfte können Tagebuch-Einträge erstellen mit:
- **Freitext-Einträgen** zur Dokumentation ihrer Erfahrungen
- **Quest-Verknüpfung** um Einträge mit spezifischen Quests zu verbinden
- **Stimmungsauswahl** zur emotionalen Einordnung:
  - 😊 Motiviert
  - 🤔 Herausgefordert
  - 🎉 Stolz
  - 😤 Frustriert
  - 💪 Selbstbewusst
  - 📚 Überfordert

### ✅ Quest-Log

Automatische Archivierung abgeschlossener Quests:
- **Historie** aller erledigten Quests
- **Bewertungen & Feedback** von Dozenten
- **Persönliche Reflektionen** zur Nachbereitung
- **Earned XP** Anzeige für jede Quest

### 📝 Hintergrundgeschichte

Bei der Charaktererstellung können Nachwuchskräfte:
- Eine **Hintergrundgeschichte** (bis zu 1000 Zeichen) verfassen
- Kontext zur Motivation und Zielen ihres Charakters geben
- Die Geschichte wird auf dem Charakterprofil angezeigt

## Technische Details

### Backend

#### Neue API-Endpunkte

**Journal-Einträge:**
- `GET /api/journal/character/:characterId` - Alle Einträge eines Charakters
- `POST /api/journal/character/:characterId` - Neuen Eintrag erstellen
- `PUT /api/journal/:entryId` - Eintrag bearbeiten
- `DELETE /api/journal/:entryId` - Eintrag löschen

**Quest-Log:**
- `GET /api/journal/questlog/:characterId` - Quest-Historie abrufen
- `PUT /api/journal/questlog/:logId/reflection` - Reflektion hinzufügen

#### Datenbank-Schema

**journal_entries:**
```sql
CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  character_id INTEGER NOT NULL,
  entry_text TEXT NOT NULL,
  entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  quest_id INTEGER,
  mood TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**quest_log:**
```sql
CREATE TABLE quest_log (
  id SERIAL PRIMARY KEY,
  character_id INTEGER NOT NULL,
  quest_id INTEGER NOT NULL,
  quest_title TEXT NOT NULL,
  quest_description TEXT,
  completed_at TIMESTAMP NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  grade TEXT,
  feedback TEXT,
  reflection TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Automatische Archivierung

Wenn eine Quest abgeschlossen wird (über Bewertung oder direkt), wird automatisch ein Eintrag im Quest-Log erstellt:

```typescript
// In quest.routes.ts, admin.routes.ts, dozent.routes.ts
await db.run(`
  INSERT INTO quest_log (
    character_id, quest_id, quest_title, quest_description, 
    completed_at, xp_earned, grade, feedback
  )
  VALUES ($1, $2, $3, $4, now(), $5, $6, $7)
`, [characterId, questId, title, description, xpEarned, grade, feedback]);
```

### Frontend

#### Neue Komponente

**Journal.tsx** - Hauptkomponente mit zwei Tabs:

1. **Tagebuch-Tab:**
   - Formular zum Erstellen neuer Einträge
   - Liste aller Einträge mit Bearbeitungs- und Löschfunktion
   - Anzeige von Quest-Verknüpfungen und Stimmungen

2. **Quest-Log-Tab:**
   - Chronologische Liste abgeschlossener Quests
   - Anzeige von Bewertungen und Feedback
   - Möglichkeit, Reflektionen hinzuzufügen

#### Navigation

Der Zugriff auf das Tagebuch erfolgt über:
- **Charakterprofil:** Button "📖 Tagebuch" in den Quick Actions
- **Direkte URL:** `/journal/:characterId`

#### Charaktererstellung

Die [CharacterCreation.tsx](frontend/src/pages/CharacterCreation.tsx) wurde um ein Textarea-Feld für die Hintergrundgeschichte erweitert (bereits vorhanden, funktional).

## Installation & Setup

### 1. Datenbank-Migration ausführen

```bash
cd backend
npm run db:migrate-journal
```

Oder manuell:
```bash
psql -U your_user -d your_database -f src/database/journal-migration.sql
```

### 2. Server neu starten

```bash
cd backend
npm run dev
```

### 3. Frontend testen

Navigiere zu einem Charakterprofil und klicke auf "📖 Tagebuch".

## Nutzung

### Für Nachwuchskräfte

1. **Tagebuch-Eintrag erstellen:**
   - Öffne dein Charakterprofil
   - Klicke auf "📖 Tagebuch"
   - Verfasse deinen Eintrag im Tab "Tagebuch"
   - Optional: Verknüpfe mit einer Quest und wähle eine Stimmung
   - Klicke auf "Eintrag erstellen"

2. **Quest-Log einsehen:**
   - Wechsle zum Tab "Quest-Log"
   - Siehe deine abgeschlossenen Quests mit Bewertungen
   - Füge Reflektionen zu Quests hinzu

3. **Hintergrundgeschichte:**
   - Bei der Charaktererstellung im Feld "Hintergrundgeschichte"
   - Wird auf dem Charakterprofil angezeigt

### Für Dozenten & Admins

Das Quest-Log wird automatisch beim Bewerten von Abgaben befüllt. Keine zusätzlichen Schritte erforderlich.

## Weitere Entwicklung

Mögliche Erweiterungen:
- 📸 Bilder zu Tagebuch-Einträgen hinzufügen
- 🏷️ Tags für Einträge
- 🔍 Such- und Filterfunktion
- 📊 Stimmungs-Statistiken
- 📤 Export-Funktion für das gesamte Tagebuch
- 🤝 Teilen von Einträgen mit Dozenten

## Support

Bei Fragen oder Problemen siehe:
- [Backend Routes](backend/src/routes/journal.routes.ts)
- [Frontend Komponente](frontend/src/pages/Journal.tsx)
- [API Services](frontend/src/services/api.ts)
