# Charakter Creation System - Benutzerhandbuch

Das nachfolgende Dokument wurde von Mario Schamp geschrieben. Es ist zum Zwecke der Gamification Nutzung innerhalb des LernLab IT zu verwenden und darf nicht reproduziert werden.

## Inhaltsverzeichnis
1. [Überblick](#überblick)
2. [Für Nachwuchskräfte (NWK)](#für-nachwuchskräfte)
3. [Für Dozenten](#für-dozenten)
4. [Für Admins](#für-admins)
5. [Häufig gestellte Fragen](#häufig-gestellte-fragen)

---

## Überblick

Das Charakter Creation System ist ein gamifiziertes Lernmanagementsystem, das Nachwuchskräfte durch das Lösen von Quests (Aufgaben) motiviert, ihre Fähigkeiten zu entwickeln. Das System basiert auf folgenden Kernkonzepten:

- **Charakter**: Jede NWK hat einen Charakter mit verschiedenen Fähigkeiten (Skills)
- **Quests**: Aufgaben, die von Dozenten erstellt und NWKs zugewiesen werden
- **XP & Level**: Nachwuchskräfte erhalten Erfahrungspunkte (XP) und steigen im Level auf
- **Skills**: Attribute wie Programmierung, Netzwerke, Datenbanken, Hardware, Sicherheit und Projektmanagement
- **Equipment**: Gegenstände, die als Belohnungen dienen oder vorausgesetzt sind
- **Tagebuch**: Dokumentation des Lernfortschritts mit Reflexionen

---

## Für Nachwuchskräfte

### 1. Character erstellen

**Schritt 1:** Melden Sie sich an und klicken Sie auf "Charakter erstellen" im Dashboard

**Schritt 2:** Füllen Sie folgende Informationen aus:
- **Name**: Der Name Ihres Charakters (z.B. "Code Master", "Network Ninja")
- **Persönliche Geschichte (optional)**: Beschreiben Sie Ihren Charakter (max. 1000 Zeichen)
- **Initiale Skills**: Verteilen Sie Punkte auf Ihre Fähigkeiten (0-20 pro Skill)
- **Lehrgang**: Wählen Sie Ihre Gruppe (vom Dozenten/Admin vorab angelegt)

**Schritt 3:** Klicken Sie "Character erstellen"

**💡 Tipp**: Wählen Sie Skills basierend auf Ihren Interessen. Sie können diese später durch Quests weiterentwickeln.

### 2. Quests anzeigen und starten

**Im Quests-Bereich:**

1. Sehen Sie alle Ihnen zugewiesenen Quests
2. **Filterung**:
   - **Status**: Alle, Verfügbar, In Bearbeitung, Abgeschlossen
   - **Kategorie**: Wählen Sie eine Kategorie im Dropdown
   - **Filter zurücksetzen**: Button um alle Filter zu löschen

3. **Verfügbare Quests starten**: Klicken Sie "Quest starten" auf einer verfügbaren Quest
4. **Details anzeigen**: Klicken Sie auf den Quest-Titel, um Details im Popup zu sehen

**⚠️ Wichtig**: 
- Überprüfen Sie das **Mindestlevel** der Quest
- Falls eine Quest **Equipment voraussetzt**, müssen Sie diesen Gegenstand haben
- Eine Quest kann nur gestartet werden, wenn beide Bedingungen erfüllt sind

### 3. Quest absolvieren und einreichen

**Während der Quest:**
- Sie können die Quest verfolgen und sehen den aktuellen Status
- Text-Submission oder Datei-Upload möglich

**Abgabe:**
1. Geben Sie Ihren Lösungstext ein oder laden Sie eine Datei hoch
2. Überprüfen Sie auf Tippfehler und Vollständigkeit
3. Klicken Sie "Abgabe einreichen"
4. ⏰ **Beachten Sie die Abgabefrist** - nach dieser Zeit können keine Abgaben mehr eingereicht werden

**Status nach Abgabe**: "Eingereicht" - warten Sie auf die Bewertung durch einen Dozenten

### 4. Bewertung erhalten

Die Bewertung erfolgt durch einen Dozenten:
- ✅ **Angenommen**: Sie erhalten volle Belohnungen (XP, Skills, ggf. Equipment/Titel)
- ❌ **Abgelehnt**: Sie erhalten Feedback und können die Quest später erneut versuchen

**Nach Annahme:**
- XP werden zu Ihrem Charakter addiert
- Skills werden erhöht
- Sie steigen möglicherweise einen Level auf
- Neue Quests könnten freigeschaltet werden

### 5. Tagebuch nutzen

**Zweck**: Dokumentation Ihres Lernfortschritts

**Journal-Einträge erstellen:**
1. Navigieren Sie zu "Tagebuch" im Charakter-Detail
2. Schreiben Sie einen Eintrag über Ihre Erfahrungen
3. (Optional) Verknüpfen Sie einen Eintrag mit einer Quest
4. (Optional) Fügen Sie ein "Mood" hinzu (Ihre Stimmung während des Lernens)

**Reflexionen zu abgeschlossenen Quests:**
1. Im Quest-Log können Sie zu jeder abgeschlossenen Quest eine Reflexion hinzufügen
2. Dies hilft bei der Selbstreflexion des Lernprozesses

---

## Für Dozenten

### 1. Zugriff auf das Dozenten-Panel

- Melden Sie sich an
- Sie sehen automatisch das "Dozenten-Panel" in der Navigation
- Im Dashboard finden Sie Quick-Links zu allen Dozenten-Funktionen

### 2. Quests erstellen

**Grundinformationen:**

| Feld | Beschreibung | Hinweise |
|------|-------------|---------|
| **Titel** | Name der Quest | Klar und aussagekräftig wählen |
| **Beschreibung** | Detaillierte Aufgabenbeschreibung | Klare Anforderungen formulieren |
| **Kategorie** | Hauptfachbereich | Optional - "Keine Kategorie" möglich |
| **Mindestlevel** | Level, das erforderlich ist | Standard: 1, erhöhen für fortgeschrittene Aufgaben |
| **Schwierigkeit** | Einfach (Easy), Mittel (Medium), Schwer (Hard) | Beeinflusst Standard-Belohnungen |

**Feinheiten - Mindestlevel:**

Das **Mindestlevel** ist eine wichtige Sicherungsmaßnahme:

- **Level 1-5**: Grundlagen und Einführungsquests
- **Level 6-10**: Mittlere Komplexität
- **Level 11-20**: Fortgeschrittene Themen
- **Level 21+**: Spezialisierte, anspruchsvolle Aufgaben

**⚠️ Beachte**: Wenn ein NWK Level 5 hat, kann er Level 10 Quests nicht starten!

**Beispiel:**
```
Quest: "APIs verstehen"
Beschreibung: REST-APIs, HTTP-Methoden, JSON-Response
Kategorie: Programmierung
Mindestlevel: 5 (NWK sollten Grundlagen kennen)
Schwierigkeit: Mittel
```

**XP-Vergabe:**

Sie können zwei Systeme wählen:
1. **Skalierend** (Standard): XP wird automatisch basierend auf Level und Schwierigkeit berechnet
2. **Fester Wert**: Sie bestimmen die XP-Punkte

**Skill-Belohnungen:**

Die wichtigsten Einstellungen:

| Feld | Min | Max | Standard |
|------|-----|-----|----------|
| Programmierung | 0 | 250 | 2/4/6 je Schwierigkeit |
| Netzwerke | 0 | 250 | 2/4/6 je Schwierigkeit |
| Datenbanken | 0 | 250 | 2/4/6 je Schwierigkeit |
| Hardware | 0 | 250 | 2/4/6 je Schwierigkeit |
| Sicherheit | 0 | 250 | 2/4/6 je Schwierigkeit |
| Projektmanagement | 0 | 250 | 2/4/6 je Schwierigkeit |

**💡 Automatische Vorschläge**: 
- Einfache Quest: 2 Punkte für entsprechende Kategorie
- Mittlere Quest: 4 Punkte für entsprechende Kategorie
- Schwere Quest: 6 Punkte für entsprechende Kategorie

Diese sind nur Vorschläge - Sie können beliebig anpassen!

**Erweiterte Einstellungen:**

| Feld | Beschreibung | Beispiel |
|------|-------------|---------|
| **Titel-Quest** | Gibt einen Titel als Belohnung | "REST-Expert", "Network Master" |
| **Equipment-Belohnung** | Gibt Equipment als Belohnung | Spezialwerkzeuge, Bücher |
| **Equipment-Voraussetzung** | Erforderlicher Gegenstand | Ein NWK braucht einen Laptop |
| **Wiederholbar** | Quest kann mehrfach gelöst werden | Täglich, Wöchentlich, Monatlich |
| **Abgabefrist** | Deadline für Abgabe | z.B. in 7 Tagen |

**Warnung - Kritische Fehler:**

❌ **NICHT MACHEN**:
- Mindestlevel 50 für Anfänger-Quests (niemand kann sie lösen)
- Alle Skills auf 0 setzen (keine Belohnung = demotivierend)
- Abgabefrist in der Vergangenheit (unmöglich einzureichen)
- Equipment-Voraussetzung ohne dass NWKs diesen bekommen können

### 3. Quests verwalten

**Quests anzeigen:**
- "Quests verwalten" zeigt alle erstellten Quests (für Dozenten und Admins)
- Sehen Sie: Anzahl Zuweisungen, Anzahl Abgaben
- Der Ersteller ist auf einen Blick sichtbar
- Klicken Sie auf den Quest-Titel, um die Details zu sehen

**Quest bearbeiten:**
- Klicken Sie auf die Quest
- Ändern Sie beliebige Felder
- Klicken Sie "Speichern"

**Quest löschen:**
- ⚠️ Diese Aktion ist nicht rückgängig zu machen!
- Klicken Sie "Löschen" und bestätigen Sie

**Quest zuweisen:**

Sie können Quests auf drei Wegen zuweisen:

1. **An Nachwuchskraft**: Einzelne Person
2. **An Gruppe**: Alle Mitglieder der Gruppe
3. **An Admins-Gruppe**: Admins prüfen die Quest und geben sie frei

**Freigabe-Workflow (Pflicht):**
1. Dozent teilt die Quest an die Gruppe **Admins**
2. Ein Admin prüft und gibt die Quest frei
3. Erst danach kann die Quest an andere Gruppen oder Einzelpersonen verteilt werden

### 4. Abgaben bewerten

**Zugriff:**
- Klicken Sie "Abgaben bewerten" im Dashboard
- Sie sehen ALLE Abgaben aller Dozenten

**Filterung:**
- Quests, die Sie erstellt haben, sind **blau markiert** mit **blauem Punkt**
- So sehen Sie auf einen Blick, welche Ihre Quests sind

**Abgaben bewerten:**

1. Klicken Sie auf eine Abgabe in der Tabelle
2. Lesen Sie die Abgabe (Text und/oder Datei)
3. Wählen Sie eine Bewertung:
   - ✅ **Aufgabe erfüllt**: NWK erhält volle Belohnungen
   - ❌ **Abgelehnt**: Geben Sie Feedback für Verbesserung

4. **Bei Ablehnung**: Feedback ist erforderlich (z.B. "Bitte API-Dokumentation mitliefern")

5. Klicken Sie "Bewertung speichern"

**💡 Best Practice**:
- Feedback sei konstruktiv und ermutigend
- Geben Sie konkrete Verbesserungsvorschläge
- Loben Sie Stärken und weisen auf Schwächen hin

### 5. Gruppen verwalten

**Gruppen erstellen:**
1. Klicken Sie "Gruppen verwalten"
2. Geben Sie einen Gruppennamen ein
3. (Optional) Beschreibung hinzufügen
4. Klicken Sie "Gruppe erstellen"

**Mitglieder hinzufügen:**
1. Wählen Sie eine Gruppe
2. Klicken Sie "Mitglied hinzufügen"
3. Wählen Sie einen Nachwuchskraft
4. Bestätigen Sie

**Gruppe löschen:**
- Klicken Sie "Löschen"
- ⚠️ Dies ist nicht rückgängig zu machen!

### 6. Equipment verwalten

**Equipment erstellen:**
1. Klicken Sie "Equipment verwalten"
2. Geben Sie ein:
   - **Name**: z.B. "Laptop", "API-Dokumentation"
   - **Seltenheit**: Common, Uncommon, Rare, Epic, Legendary
   - (Optional) **Beschreibung**: Wofür wird das Equipment benötigt?

3. Klicken Sie "Erstellen"

**Equipment als Belohnung verwenden:**
- Verknüpfen Sie Equipment mit einer Quest
- NWK erhalten das Equipment nach bestandener Quest

**Equipment als Voraussetzung verwenden:**
- Setzen Sie eine Equipment-Voraussetzung
- NWK können Quest nur starten, wenn sie das Equipment haben

**Beispiele:**

```
Name: "Python-Umgebung konfiguriert"
Seltenheit: Common
Quest-Voraussetzung: "Python-Intro"

Name: "Advanced Security Tools"
Seltenheit: Epic
Quest-Belohnung: "Penetration Testing Advanced"
```

---

## Für Admins

Admins haben alle Dozenten-Funktionen PLUS:

### 1. Admin-Panel

Zugriff: "Admin-Panel" in der Navigation

### 2. Benutzer verwalten

- Sehen Sie alle Benutzer
- Genehmigen Sie ausstehende Dozenten-Anfragen
- Löschen Sie Benutzer (⚠️ nicht reversibel)
- Rollen und Adminrechte ändern (nur wenn Rolle "Admin" und Admin-Status "Ja")

### 3. Alle Quests sehen

- Admins sehen ALLE Quests
- Sie können alle Quests bearbeiten und löschen
- Sie können Abgaben von allen Quests bewerten
- Quests lassen sich im Admin-Panel in der Prüfung öffnen und prüfen

### 4. Rollen und Rechte (Wichtig)

- **Voller Admin**: Rolle "Admin" **und** Admin-Status "Ja"
- **Dozent mit Admin-Status "Ja"**: Darf Quests prüfen, aber **keine** Rollen/Adminrechte vergeben

### 4. System-Überwachung

- Überwachen Sie die Aktivität
- Sehen Sie Statistiken
- Verwalten Sie systemweite Einstellungen

---

## Häufig gestellte Fragen

### Q: Ein NWK kann eine Quest nicht starten - warum?
**A**: Mögliche Gründe:
1. Level zu niedrig (überprüfen Sie Mindestlevel der Quest)
2. Equipment-Voraussetzung nicht erfüllt
3. Quest nicht zugewiesen

**Lösung**: 
- Überprüfen Sie das NWK-Level und Equipment
- Weisen Sie die Quest erneut zu, falls nötig

### Q: Wie lange dauert es, bis ein NWK eine Abgabe bewerten kann?
**A**: Es gibt kein Zeitlimit. Sie können eine Abgabe jederzeit bewerten.

**💡 Tipp**: Bewerten Sie Abgaben zeitnah, um NWKs Feedback zu geben

### Q: Was passiert, wenn das maximale Attribut (250) erreicht ist?
**A**: Der Wert wird auf 250 begrenzt. Weitere Quest-Belohnungen für diesen Skill werden nicht mehr addiert.

### Q: Kann ein NWK eine Quest mehrfach machen?
**A**: Nur wenn Sie die Quest als "wiederholbar" markiert haben. Dann kann sie täglich/wöchentlich/monatlich wiederholt werden.

### Q: Wie stelle ich sicher, dass Quests angemessen schwer sind?
**A**: 
- **Mindestlevel**: Passen Sie es an den aktuellen Skill an
- **Schwierigkeit**: Wählen Sie realistisch
- **Belohnungen**: Höhere Schwierigkeit = höhere Belohnungen
- **Feedback einholen**: Fragen Sie NWKs nach Schwierigkeitsgrad

### Q: Kann ich eine Abgabe nach der Bewertung noch ändern?
**A**: Nein. Sie müssen die Bewertung auf 0 setzen und neu bewerten.

### Q: Was ist der Unterschied zwischen Status "Abgelehnt" und "Nicht bestanden"?
**A**: 
- **Abgelehnt**: Sie haben es bewertet und es ist falsch
- **Nicht bestanden**: Die Quest-Frist ist abgelaufen

### Q: Wie viel XP sollte eine Quest geben?
**A**: Richtlinie:
- **Einfach**: 50 XP
- **Mittel**: 100 XP
- **Schwer**: 200 XP

Dies wird mit dem Mindestlevel skaliert.

### Q: Ein NWK hat die gleiche Quest von zwei verschiedenen Dozenten erhalten. Was passiert?
**A**: Der NWK sieht die Quest zweimal. Wenn er eine Abgabe macht, wird sie für beide Zuweisungen registriert. Jeder Dozent kann die Abgabe bewerten.

### Q: Wie kann ich sehen, welche Abgaben noch ausstehend sind?
**A**: In "Abgaben bewerten":
- Sehen Sie alle eingereichten Abgaben
- Filtern Sie nach "Unbewertete Abgaben"
- Blau markierte Quests sind Ihre (schneller zu erkennen)

---

## Wichtige Best Practices

### Für Dozenten bei Quest-Erstellung:

✅ **GUTE PRAKTIKEN**:
- Klare, spezifische Anforderungen formulieren
- Angemessene Mindestlevel setzen
- Konstruktives Feedback geben
- Belohnungen an Schwierigkeit anpassen
- Regelmäßig Abgaben bewerten

❌ **DINGE ZU VERMEIDEN**:
- Vage Aufgabenstellungen ("mach was Cooles")
- Unerreichbare Mindestlevel
- Zu wenige Belohnungen (demotivierend)
- Abgaben nicht bewerten lassen
- Unmögliche Abgabefrist setzen

### Für Nachwuchskräfte bei Quest-Lösung:

✅ **GUTE PRAKTIKEN**:
- Quest-Anforderungen gründlich lesen
- Vor Abgabe überprüfen
- Fragen stellen, wenn etwas unklar ist
- Tagebuch für Lernreflexion nutzen
- Equipment als Lernhilfe nutzen

❌ **DINGE ZU VERMEIDEN**:
- Abgabe ohne Überprüfung einreichen
- Abgabefrist ignorieren
- Unvollständige Aufgaben abgeben
- Mindestlevel-Anforderungen ignorieren

**Viel Erfolg beim Lernen und Unterrichten!** 🎮📚
