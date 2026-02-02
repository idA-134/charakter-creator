# Journal & Quest-Log Migration

Dieses Skript fügt die neuen Tabellen für das Tagebuch-Feature hinzu.

## Migration ausführen

### PostgreSQL (Produktion):
```bash
cd backend
npm run migrate:journal
```

Oder manuell mit psql:
```bash
psql -U your_user -d your_database -f src/database/journal-migration.sql
```

## Neue Tabellen

### journal_entries
Tagebuch-Einträge der Nachwuchskräfte zur Dokumentation ihrer Erfahrungen.

### quest_log
Historie aller abgeschlossenen Quests mit Bewertungen und Reflektionen.

## Features

- ✅ Journal-Einträge mit Stimmung und Quest-Verknüpfung
- ✅ Quest-Log für abgeschlossene Quests
- ✅ Reflektionen zu abgeschlossenen Quests
- ✅ Automatische Archivierung bei Quest-Abschluss
