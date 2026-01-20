# 📎 Datei-Upload System für Quest-Abgaben

## Übersicht

Das System ermöglicht es Spielern, bei Quest-Abgaben Dokumente und Dateien hochzuladen (z.B. Code-Dateien, PDFs, Screenshots).

---

## 🎯 Features

- ✅ **Datei-Upload** bei Quest-Abgaben
- ✅ **Verschiedene Dateitypen** unterstützt (siehe unten)
- ✅ **Maximale Dateigröße:** 10 MB
- ✅ **Sichere Speicherung** mit eindeutigen Dateinamen
- ✅ **Download-Funktion** für Dozenten und Spieler
- ✅ **Automatische Benachrichtigung** bei Upload

---

## 📁 Erlaubte Dateitypen

### Dokumente
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- CSV (`.csv`)

### Bilder
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)

### Code & Text
- Textdateien (`.txt`)
- HTML (`.html`)
- CSS (`.css`)
- JavaScript (`.js`)
- JSON (`.json`)
- XML (`.xml`)

### Archive
- ZIP (`.zip`)
- RAR (`.rar`)

---

## 🔧 API-Endpunkte

### 1. Quest-Abgabe mit Datei einreichen

```http
POST /api/quests/:questId/submit
Content-Type: multipart/form-data
```

**Parameter:**
- `characterId` (number, required) - ID des Charakters
- `submission_text` (string, optional) - Textbeschreibung
- `file` (file, optional) - Hochzuladende Datei

**Wichtig:** Mindestens `submission_text` ODER `file` muss angegeben werden!

**Beispiel mit fetch (Frontend):**
```javascript
const formData = new FormData();
formData.append('characterId', '123');
formData.append('submission_text', 'Hier ist meine Lösung...');
formData.append('file', fileInput.files[0]); // File-Input Element

const response = await fetch('/api/quests/456/submit', {
  method: 'POST',
  body: formData
  // KEIN Content-Type Header! Browser setzt ihn automatisch
});
```

**Beispiel mit curl:**
```bash
curl -X POST http://localhost:3000/api/quests/456/submit \
  -F "characterId=123" \
  -F "submission_text=Meine Lösung" \
  -F "file=@/pfad/zur/datei.pdf"
```

**Response:**
```json
{
  "id": 789,
  "character_id": 123,
  "quest_id": 456,
  "status": "submitted",
  "submission_text": "Hier ist meine Lösung...",
  "submission_file_url": "uploads/submissions/solution-1234567890-123456789.pdf",
  "submitted_at": "2026-01-19T10:30:00.000Z"
}
```

---

### 2. Datei herunterladen

```http
GET /api/quests/submission/:submissionId/download
```

**Parameter:**
- `submissionId` (number) - ID der Abgabe

**Beispiel:**
```javascript
// Im Frontend: Link zum Download
<a href={`/api/quests/submission/${submission.id}/download`} download>
  Datei herunterladen
</a>
```

**Response:** Die Datei wird als Download gesendet

---

## 📂 Datei-Speicherung

### Ordnerstruktur

```
backend/
├── uploads/
│   └── submissions/
│       ├── solution-1705660800000-987654321.pdf
│       ├── code_file-1705660801000-123456789.zip
│       └── screenshot-1705660802000-456789123.png
```

### Dateinamen

Generiert nach dem Muster:
```
{sanitizedOriginalName}-{timestamp}-{randomNumber}.{extension}
```

**Beispiel:**
- Original: `Meine Lösung.pdf`
- Gespeichert: `Meine_Loesung-1705660800000-987654321.pdf`

---

## 🛡️ Sicherheit

### Validierung

1. **Dateityp-Check:** Nur erlaubte MIME-Types
2. **Größenbeschränkung:** Maximal 10 MB
3. **Eindeutige Namen:** Verhindert Überschreibungen
4. **Sanitization:** Sonderzeichen werden entfernt

### Best Practices

```typescript
// ❌ Schlecht: Originalnamen direkt verwenden
const fileName = file.originalname;

// ✅ Gut: Sanitization und eindeutige ID
const fileName = `${sanitizedName}-${timestamp}-${randomId}${ext}`;
```

---

## 🎨 Frontend-Integration

### React-Komponente Beispiel

```typescript
import React, { useState } from 'react';

const QuestSubmission = ({ questId, characterId }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData();
    formData.append('characterId', characterId.toString());
    
    if (text) formData.append('submission_text', text);
    if (file) formData.append('file', file);

    try {
      const response = await fetch(`/api/quests/${questId}/submit`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Abgabe erfolgreich! ✅');
      } else {
        const error = await response.json();
        alert(`Fehler: ${error.error}`);
      }
    } catch (error) {
      alert('Netzwerkfehler');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Beschreibe deine Lösung..."
      />
      
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        accept=".pdf,.doc,.docx,.zip,.jpg,.png,.txt"
      />
      
      {file && <p>Ausgewählt: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>}
      
      <button type="submit" disabled={uploading || (!text && !file)}>
        {uploading ? 'Lädt hoch...' : 'Abgabe einreichen'}
      </button>
    </form>
  );
};
```

---

## 🔍 Fehlerbehandlung

### Häufige Fehler

**1. Datei zu groß**
```json
{
  "error": "File too large"
}
```
**Lösung:** Datei kleiner als 10 MB hochladen

**2. Dateityp nicht erlaubt**
```json
{
  "error": "Dateityp nicht erlaubt: application/exe. Erlaubte Typen: PDF, Word, ..."
}
```
**Lösung:** Nur erlaubte Dateitypen verwenden

**3. Keine Datei und kein Text**
```json
{
  "error": "Mindestens Text oder Datei erforderlich"
}
```
**Lösung:** Text ODER Datei (oder beides) hochladen

---

## 🗃️ Datenbank-Schema

### character_quests Tabelle

```sql
CREATE TABLE character_quests (
  id INTEGER PRIMARY KEY,
  character_id INTEGER NOT NULL,
  quest_id INTEGER NOT NULL,
  submission_text TEXT,                -- Optional: Textbeschreibung
  submission_file_url TEXT,            -- Optional: Dateipfad
  submitted_at TEXT,
  status TEXT DEFAULT 'available',
  -- ... weitere Felder
);
```

**Beispiel-Eintrag:**
```sql
{
  "id": 123,
  "character_id": 456,
  "quest_id": 789,
  "submission_text": "Ich habe die Aufgabe gelöst...",
  "submission_file_url": "uploads/submissions/solution-1705660800000-987654321.pdf",
  "submitted_at": "2026-01-19T10:30:00.000Z",
  "status": "submitted"
}
```

---

## 🧹 Wartung

### Alte Dateien löschen

Erstelle einen Cron-Job oder Task, um alte Dateien zu bereinigen:

```typescript
// cleanup-old-uploads.ts
import fs from 'fs';
import path from 'path';

const MAX_AGE_DAYS = 90; // 3 Monate
const uploadDir = path.join(__dirname, '../uploads/submissions');

const now = Date.now();
const files = fs.readdirSync(uploadDir);

files.forEach(file => {
  const filePath = path.join(uploadDir, file);
  const stats = fs.statSync(filePath);
  const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
  
  if (ageInDays > MAX_AGE_DAYS) {
    fs.unlinkSync(filePath);
    console.log(`Gelöscht: ${file} (${ageInDays.toFixed(0)} Tage alt)`);
  }
});
```

---

## 📊 Statistiken

### Speicherverbrauch überwachen

```typescript
import fs from 'fs';
import path from 'path';

function getDirectorySize(dirPath: string): number {
  let size = 0;
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    size += stats.size;
  });
  
  return size;
}

const uploadDir = path.join(__dirname, '../uploads/submissions');
const sizeInMB = getDirectorySize(uploadDir) / (1024 * 1024);
console.log(`Upload-Ordner: ${sizeInMB.toFixed(2)} MB`);
```

---

## 🚀 Deployment-Hinweise

### Wichtig für Production:

1. **uploads/ Ordner nicht in Git committen**
   - Bereits in `.gitignore` eingetragen

2. **Backup-Strategie**
   - Uploads regelmäßig auf externen Storage sichern
   - Empfehlung: AWS S3, Google Cloud Storage

3. **Speicherplatz überwachen**
   - Disk-Space Alerts einrichten
   - Cleanup-Job für alte Dateien

4. **Maximale Dateigröße anpassen**
   ```typescript
   // In middleware/upload.ts
   limits: {
     fileSize: 20 * 1024 * 1024, // 20 MB statt 10 MB
   }
   ```

5. **Nginx-Konfiguration anpassen**
   ```nginx
   client_max_body_size 20M;
   ```

---

## ✅ Testing

### Mit curl testen:

```bash
# 1. Quest starten
curl -X POST http://localhost:3000/api/quests/1/start \
  -H "Content-Type: application/json" \
  -d '{"characterId": 1}'

# 2. Mit Datei abgeben
curl -X POST http://localhost:3000/api/quests/1/submit \
  -F "characterId=1" \
  -F "submission_text=Meine Lösung" \
  -F "file=@testfile.pdf"

# 3. Datei herunterladen
curl http://localhost:3000/api/quests/submission/1/download -o downloaded.pdf
```

---

**Happy Uploading! 📎✨**
