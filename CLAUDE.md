# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server (Vite, localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview production build
```

No test runner is configured.

## Architecture

**fret-notes** is a Vue 3 + Vite single-page app that lets guitarists click a fretboard and see the resulting chord name identified in real time.

### Data flow

```
ChordChart.vue  (user clicks frets / toggles string mutes)
  └─ emits { strings, cells }
App.vue
  └─ chartToNotes(strings, cells)   → { noteObjs, pitchClasses }   [guitar.js]
  └─ detectChord(pitchClasses)      → ranked chord matches          [chords.js]
  └─ displays chord name
```

### Music logic layer (`src/music/`)

Pure JS, no Vue dependency — safe to unit-test in isolation.

| File | Responsibility |
|---|---|
| `notes.js` | Chromatic scale, enharmonic normalization (flats → sharps), semitone ↔ note name, `calcInterval()` |
| `guitar.js` | `STANDARD_TUNING`, `fretToNoteObj()` (string + fret + capo → note), `chartToNotes()` (converts ChordChart emit payload to note arrays) |
| `chords.js` | `CHORD_PATTERNS` table, `detectChord()` (matches pitch-class sets against patterns, returns ranked results), `getIntervals()` |

**Conventions in the music layer:**
- All pitch classes use sharps (`C#`, `D#`, …), never flats. Normalize with `normalizeNote()` before any lookup.
- Absolute semitone values follow MIDI-like convention: C4 = 60 (i.e. `(octave + 1) * 12 + semitone`).
- String index in `guitar.js`: **0 = low E (6th string)**, 5 = high e (1st string). ChordChart emits `string` as 1–6 where **1 = high e**, so the conversion is `stringIndex = 6 - cell.string`.
- `detectChord` accepts a `Set<string>` of pitch class names and returns results sorted by score (match count − 0.5 × missing count). The first result is the best match.

### Components (`src/components/`)

- **`ChordChart.vue`** — interactive 6×5 fret grid (5 frets shown, up to 5 simultaneous dots). Tracks `stringStatus` (O/X per string) and `pressedCells`. Emits `change` on every interaction. Contains `CapoSelect` as a child but capo value is not yet wired into `chartToNotes`.
- **`partials/CapoSelect.vue`** — dropdown stub (Fret 1–12); not yet connected to any reactive state.
- **`Keyboard.vue`** — piano keyboard component (exists but not yet used in App.vue).

### Known incomplete wiring
- Capo: `CapoSelect` renders but its selected value is not passed up to `chartToNotes`; the `capo` parameter defaults to 0.
- `Keyboard.vue` is built but not integrated into the main UI.
