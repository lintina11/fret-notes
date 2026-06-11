/**
 * 半音索引 0–11，以 C 為起點
 * 升記號為主，降記號透過 ENHARMONICS 正規化
 */
export const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const ENHARMONICS = {
  Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B',
}

/** 'Bb' → 'A#'，已是升記號則原樣回傳 */
export function normalizeNote(note) {
  return ENHARMONICS[note] ?? note
}

/** 'F#' → 6 */
export function noteToSemitone(note) {
  return CHROMATIC.indexOf(normalizeNote(note))
}

/** 6 → 'F#'（mod 12 自動處理溢位） */
export function semitoneToNote(n) {
  return CHROMATIC[((n % 12) + 12) % 12]
}

/**
 * 以半音數位移音名，不改變八度
 * transposeNote('E', 3) → 'G'
 */
export function transposeNote(note, semitones) {
  return semitoneToNote(noteToSemitone(normalizeNote(note)) + semitones)
}

/**
 * 將音名 + 八度轉為絕對半音值（以 C0 = 0 為基準）
 * midiNumber('C', 4) → 48，中央 C = 60 對應 C4 需加 12
 * 這裡採用常見慣例：C4 = 60
 */
export function toAbsoluteSemitone(note, octave) {
  return noteToSemitone(normalizeNote(note)) + (octave + 1) * 12
}

/**
 * 從絕對半音值反推音名與八度
 * fromAbsoluteSemitone(64) → { note: 'E', octave: 4 }
 */
export function fromAbsoluteSemitone(abs) {
  const note = semitoneToNote(abs)
  const octave = Math.floor(abs / 12) - 1
  return { note, octave }
}

/**
 * 計算兩個絕對半音值之間的音程資訊
 * 低音在前，高音在後（若順序相反會自動處理）
 *
 * 回傳：
 *   semitones   - 實際半音差（含八度）
 *   simpleName  - 簡單音程名稱，如 'm3'、'P5'
 *   compoundName- 複合音程名稱，如 'm10'（跨八度時與 simpleName 不同）
 *   octaveSpan  - 跨越幾個完整八度
 */
export function calcInterval(absLow, absHigh) {
  const diff = Math.abs(absHigh - absLow)
  const semitones = diff

  const octaveSpan = Math.floor(semitones / 12)
  const remainder = semitones % 12  // 去掉整數八度後剩餘半音

  const simpleName = INTERVAL_NAMES[remainder]
  const compoundName = octaveSpan === 0
    ? simpleName
    : COMPOUND_INTERVAL_NAMES[remainder]?.(octaveSpan) ?? simpleName

  return { semitones, simpleName, compoundName, octaveSpan }
}

// 簡單音程：0–11 半音 → 音程名稱
const INTERVAL_NAMES = {
  0:  'P1',   // 完全一度
  1:  'm2',   // 小二度
  2:  'M2',   // 大二度
  3:  'm3',   // 小三度
  4:  'M3',   // 大三度
  5:  'P4',   // 完全四度
  6:  'TT',   // 增四度/減五度（三全音）
  7:  'P5',   // 完全五度
  8:  'm6',   // 小六度
  9:  'M6',   // 大六度
  10: 'm7',   // 小七度
  11: 'M7',   // 大七度
}

// 複合音程：每多一個八度，度數 +7
const SIMPLE_DEGREE = {
  0: 1, 1: 2, 2: 2, 3: 3, 4: 3, 5: 4, 6: 5, 7: 5, 8: 6, 9: 6, 10: 7, 11: 7,
}
const QUALITY_PREFIX = {
  0: 'P', 1: 'm', 2: 'M', 3: 'm', 4: 'M', 5: 'P', 6: 'TT', 7: 'P',
  8: 'm', 9: 'M', 10: 'm', 11: 'M',
}
const COMPOUND_INTERVAL_NAMES = Object.fromEntries(
  Object.entries(SIMPLE_DEGREE).map(([semitone, degree]) => [
    Number(semitone),
    (octaveSpan) => `${QUALITY_PREFIX[semitone]}${degree + octaveSpan * 7}`,
  ])
)
