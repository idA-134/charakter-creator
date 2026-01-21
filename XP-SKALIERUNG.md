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

| Min-Level | XP-Belohnung | % eines Levels |
|-----------|--------------|----------------|
| 1         | 50 XP        | 50%            |
| 3         | 75 XP        | 30%            |
| 5         | 100 XP       | 20%            |
| 9         | 150 XP       | 6%             |
| 10+       | **200 XP**   | **5%** (fest)  |

Ab Level 10 bleibt die Belohnung konstant bei **200 XP = 5% eines Levels**.

### Medium Quests (Basis: 100 XP)

| Min-Level | XP-Belohnung | % eines Levels |
|-----------|--------------|----------------|
| 1         | 100 XP       | 100%           |
| 3         | 150 XP       | 60%            |
| 5         | 200 XP       | 40%            |
| 9         | 300 XP       | 12%            |
| 10+       | **400 XP**   | **10%** (fest) |

Ab Level 10 bleibt die Belohnung konstant bei **400 XP = 10% eines Levels**.

### Hard Quests (Basis: 200 XP)

| Min-Level | XP-Belohnung | % eines Levels |
|-----------|--------------|----------------|
| 1         | 200 XP       | 200%           |
| 3         | 300 XP       | 120%           |
| 5         | 400 XP       | 80%            |
| 9         | 600 XP       | 23%            |
| 10+       | **800 XP**   | **20%** (fest) |

Ab Level 10 bleibt die Belohnung konstant bei **800 XP = 20% eines Levels**.

---

## 🎮 Level-Progression (Zur Erinnerung)

Das Charakter-Level benötigt bis Level 10 exponentiell steigende XP, danach eine feste Summe:

```typescript
// Levels 1-9:
XP für Level N = 100 × 1.5^(N-1)

// Ab Level 10:
XP für Level N = 4000 (fest)
```

| Level | XP benötigt | Gesamt XP |
|-------|-------------|-----------|
| 1 → 2 | 100         | 100       |
| 2 → 3 | 150         | 250       |
| 3 → 4 | 225         | 475       |
| 5 → 6 | 506         | 1.318     |
| 9 → 10 | 2.562     | 7.486     |
| 10 → 11 | 4.000     | 11.486    |
| 11 → 12 | 4.000     | 15.486    |
| 15 → 16 | 4.000     | 31.486    |
| 20 → 21 | 4.000     | 51.486    |
| 30 → 31 | 4.000     | 91.486    |
| 40 → 41 | 4.000     | 131.486   |
| 49 → 50 | 4.000     | 167.486   |
| **50** | **MAX LEVEL** | - |

---

## ⚖️ Balancing-Überlegungen

### Warum 0.25 als Skalierungsfaktor (bis Level 9)?

Der Faktor **0.25** (25% pro Level) für Level 1-9 wurde gewählt, weil:

1. **Moderate Skalierung:** Nicht zu schnell, nicht zu langsam
2. **Fair für alle Level:** Anfänger können aufholen, Fortgeschrittene werden belohnt
3. **Einfach zu berechnen:** Klare, verständliche Mathematik

### Ab Level 10: Feste prozentuale Belohnung

Ab Level 10 beträgt jedes Level fest **4000 XP**. Daher erhalten Quests ab Level 10 eine feste prozentuale Belohnung:

- **Easy Quest:** 5% eines Levels = **200 XP**
- **Medium Quest:** 10% eines Levels = **400 XP**
- **Hard Quest:** 20% eines Levels = **800 XP**

Dies sorgt für:
- ✅ **Konsistente Progression** ab Level 10
- ✅ **Berechenbare Belohnungen** für Spieler
- ✅ **Keine Inflation** bei höheren Levels

### Beispiel-Szenarien

#### Szenario 1: Level 10 Spieler

Ein Level 10 Spieler kann:
- **Easy Quest (Level 10+):** 200 XP → 5% des nächsten Levels
- **Medium Quest (Level 10+):** 400 XP → 10% des nächsten Levels  
- **Hard Quest (Level 10+):** 800 XP → 20% des nächsten Levels

#### Szenario 2: Level 5 Spieler macht Quest für Level 10

Ein Level 5 Spieler sieht die Quest, aber:
- ❌ Kann sie nicht starten (Mindestlevel-Sperre)
- ✅ Weiß, dass sie **200-800 XP** bringt
- 🎯 Hat Motivation, Level 10 zu erreichen

#### Szenario 3: Level 25 Spieler macht alte Level 1 Quest

- Quest gibt nur 50-200 XP (Basis-Wert)
- Ineffizient für Fortschritt (< 5% eines Levels)
- ✅ Fördert, dass Spieler neue, anspruchsvolle Quests machen

---

## 🛠️ Technische Implementation

### Automatische Berechnung beim Quest-Erstellen

```typescript
// backend/src/routes/dozent.routes.ts

function calculateScaledXP(baseXP: number, minLevel: number): number {
  // Für Level 1-9: Exponentielle Skalierung
  if (minLevel < 10) {
    const scalingFactor = 1 + (minLevel - 1) * 0.25;
    return Math.floor(baseXP * scalingFactor);
  }
  
  // Ab Level 10: Feste prozentuale Belohnung (basierend auf 4000 XP pro Level)
  // Easy: 5%, Medium: 10%, Hard: 20%
  const percentages: { [key: number]: number } = {
    50: 0.05,   // Easy
    100: 0.10,  // Medium
    200: 0.20   // Hard
  };
  
  return Math.floor(4000 * (percentages[baseXP] || 0.10));
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

Sollte das Balancing angepasst werden, ändere einfach die Werte in:

**`backend/src/routes/dozent.routes.ts`**:

```typescript
// Für Level 1-9:
const scalingFactor = 1 + (minLevel - 1) * 0.25;  // ← Hier anpassen!

// Ab Level 10:
// Easy: 5%, Medium: 10%, Hard: 20% von 4000 XP
const percentages: { [key: number]: number } = {
  50: 0.05,   // Easy - ändern für mehr/weniger XP
  100: 0.10,  // Medium - ändern für mehr/weniger XP
  200: 0.20   // Hard - ändern für mehr/weniger XP
};
```

Dann:
```bash
npm run db:update-xp  # Alle Quests aktualisieren
```

---

**Happy Leveling! 🎮⚔️✨**
