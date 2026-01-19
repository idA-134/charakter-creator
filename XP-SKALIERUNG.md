# 📊 XP-Skalierungs-System

## Übersicht

Das XP-System wurde erweitert, um **Quests mit höherem Mindestlevel automatisch mehr XP zu geben**. Dies sorgt für ein ausgewogenes Spielerlebnis, bei dem fortgeschrittene Spieler angemessen belohnt werden.

---

## 🎯 Wie funktioniert die Skalierung?

### Formel

```typescript
XP = Basis-XP × (1 + (Mindestlevel - 1) × 0.25)
```

### Basis-XP nach Schwierigkeit

| Schwierigkeit | Basis-XP |
|---------------|----------|
| Easy          | 50 XP    |
| Medium        | 100 XP   |
| Hard          | 200 XP   |

---

## 📈 XP-Tabellen

### Easy Quests (Basis: 50 XP)

| Min-Level | XP-Belohnung | Erhöhung |
|-----------|--------------|----------|
| 1         | 50 XP        | -        |
| 3         | 75 XP        | +50%     |
| 5         | 100 XP       | +100%    |
| 10        | 162 XP       | +224%    |
| 15        | 225 XP       | +350%    |
| 20        | 287 XP       | +474%    |

### Medium Quests (Basis: 100 XP)

| Min-Level | XP-Belohnung | Erhöhung |
|-----------|--------------|----------|
| 1         | 100 XP       | -        |
| 3         | 150 XP       | +50%     |
| 5         | 200 XP       | +100%    |
| 10        | 325 XP       | +225%    |
| 15        | 450 XP       | +350%    |
| 20        | 575 XP       | +475%    |

### Hard Quests (Basis: 200 XP)

| Min-Level | XP-Belohnung | Erhöhung |
|-----------|--------------|----------|
| 1         | 200 XP       | -        |
| 3         | 300 XP       | +50%     |
| 5         | 400 XP       | +100%    |
| 10        | 650 XP       | +225%    |
| 15        | 900 XP       | +350%    |
| 20        | 1.150 XP     | +475%    |

---

## 🎮 Level-Progression (Zur Erinnerung)

Das Charakter-Level selbst benötigt exponentiell steigende XP:

```typescript
XP für Level N = 100 × 1.5^(N-1)
```

| Level | XP benötigt | Gesamt XP |
|-------|-------------|-----------|
| 1 → 2 | 100         | 100       |
| 2 → 3 | 150         | 250       |
| 3 → 4 | 225         | 475       |
| 5 → 6 | 506         | 1.318     |
| 10 → 11 | 3.843     | 11.329    |
| 15 → 16 | 29.185    | 87.353    |
| 20 → 21 | 221.623   | 664.666   |

---

## ⚖️ Balancing-Überlegungen

### Warum 0.25 als Skalierungsfaktor?

Der Faktor **0.25** (25% pro Level) wurde gewählt, weil:

1. **Moderate Skalierung:** Nicht zu schnell, nicht zu langsam
2. **Fair für alle Level:** Anfänger können aufholen, Fortgeschrittene werden belohnt
3. **Einfach zu berechnen:** Klare, verständliche Mathematik

### Beispiel-Szenarien

#### Szenario 1: Level 10 Spieler

Ein Level 10 Spieler kann:
- **Easy Quest (Level 10):** 162 XP → 4-5% des nächsten Levels
- **Medium Quest (Level 10):** 325 XP → 8-10% des nächsten Levels  
- **Hard Quest (Level 10):** 650 XP → 16-20% des nächsten Levels

#### Szenario 2: Level 5 Spieler macht Quest für Level 10

Ein Level 5 Spieler sieht die Quest, aber:
- ❌ Kann sie nicht starten (Mindestlevel-Sperre)
- ✅ Weiß, dass sie **162-650 XP** bringt
- 🎯 Hat Motivation, Level 10 zu erreichen

#### Szenario 3: Level 15 Spieler macht alte Level 1 Quest

- Quest gibt nur 50-200 XP (Basis-Wert)
- Ineffizient für Fortschritt
- ✅ Fördert, dass Spieler neue, anspruchsvolle Quests machen

---

## 🛠️ Technische Implementation

### Automatische Berechnung beim Quest-Erstellen

```typescript
// backend/src/routes/dozent.routes.ts

function calculateScaledXP(baseXP: number, minLevel: number): number {
  const scalingFactor = 1 + (minLevel - 1) * 0.25;
  return Math.floor(baseXP * scalingFactor);
}

// Wird automatisch aufgerufen:
const questMinLevel = min_level || 1;
const presetXP = xp_reward || calculateScaledXP(baseXP, questMinLevel);
```

### Bestehende Quests aktualisieren

```bash
# Einmalig ausführen:
npm run db:update-xp
```

Dieses Script:
- Liest alle existierenden Quests
- Berechnet neue XP basierend auf Mindestlevel
- Aktualisiert die Datenbank
- Zeigt eine Übersicht der Änderungen

---

## 📝 Best Practices für Quest-Ersteller

### 1. Mindestlevel passend wählen

```typescript
// ❌ Schlecht: Einfache Quest mit hohem Mindestlevel
{
  title: "Hello World",
  difficulty: "easy",
  min_level: 15  // Zu hoch!
}

// ✅ Gut: Schwierigkeit und Mindestlevel passen zusammen
{
  title: "Microservices Architecture",
  difficulty: "hard",
  min_level: 15  // Passt!
}
```

### 2. XP-Progression planen

Erstelle Quest-Ketten mit steigendem Mindestlevel:

```typescript
[
  { title: "HTML Basics", min_level: 1, difficulty: "easy" },      // 50 XP
  { title: "CSS Styling", min_level: 3, difficulty: "easy" },      // 75 XP
  { title: "JavaScript Intro", min_level: 5, difficulty: "medium" }, // 200 XP
  { title: "React Components", min_level: 10, difficulty: "hard" }   // 650 XP
]
```

### 3. Manuelle XP-Anpassung möglich

```typescript
// System-Vorschlag: 325 XP (Level 10, Medium)
// Aber du kannst auch manuell setzen:
{
  title: "Special Event Quest",
  min_level: 10,
  difficulty: "medium",
  xp_reward: 500  // Überschreibt Automatik!
}
```

---

## 🔍 Monitoring & Balancing

### Überprüfen der XP-Verteilung

```sql
-- Durchschnittliche XP pro Mindestlevel
SELECT 
  min_level,
  AVG(xp_reward) as avg_xp,
  COUNT(*) as quest_count
FROM quests
GROUP BY min_level
ORDER BY min_level;
```

### Anzeichen für Anpassungsbedarf

#### System ist zu **generös**:
- Spieler leveln zu schnell
- Höhere Level werden zu leicht erreicht
- **Lösung:** Skalierungsfaktor reduzieren (z.B. 0.2 statt 0.25)

#### System ist zu **knapp**:
- Fortgeschrittene Spieler stocken
- Höhere Quests wirken nicht lohnend
- **Lösung:** Skalierungsfaktor erhöhen (z.B. 0.3 statt 0.25)

---

## 🎨 Frontend-Anzeige

Vorschläge für die UI:

```typescript
// Quest-Karte zeigt:
<QuestCard>
  <Level>Mindestlevel: {quest.min_level}</Level>
  <XP>
    {quest.xp_reward} XP
    {quest.min_level > 1 && (
      <Tooltip>
        Basis: {baseXP} XP
        +{Math.round(((quest.xp_reward / baseXP) - 1) * 100)}% 
        für Level {quest.min_level}
      </Tooltip>
    )}
  </XP>
</QuestCard>
```

---

## 🔄 Zukünftige Erweiterungen

### Mögliche Verbesserungen:

1. **Dynamische Skalierung**
   - Faktor passt sich an Server-Statistiken an
   - Mehr Spieler = höhere Skalierung

2. **Quest-Kategorien**
   - Programmierung: Standard-Skalierung
   - Hardware: Leicht erhöhte Skalierung
   - Projektmanagement: Stark erhöhte Skalierung

3. **Zeitbasierte Boni**
   - Neue Quests: +20% XP für 1 Woche
   - Alte Quests: -10% XP nach 3 Monaten

4. **Gruppen-Quests**
   - XP wird unter Teilnehmern aufgeteilt
   - Aber: Bonus für Teamwork (+10%)

---

## 📞 Feedback

Sollte das Balancing angepasst werden, ändere einfach den Skalierungsfaktor in:

**`backend/src/routes/dozent.routes.ts`**, Zeile ~25:

```typescript
const scalingFactor = 1 + (minLevel - 1) * 0.25;  // ← Hier anpassen!
```

Dann:
```bash
npm run db:update-xp  # Alle Quests aktualisieren
```

---

**Happy Leveling! 🎮⚔️✨**
