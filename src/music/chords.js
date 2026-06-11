import { noteToSemitone, toAbsoluteSemitone, calcInterval } from './notes.js'

/**
 * 和弦型態定義：以根音為 0，列出各音距根音的半音數
 * 順序影響辨識優先級（較常見的放前面）
 */
export const CHORD_PATTERNS = [
  { type: 'maj',   semitones: [0, 4, 7],         symbol: '' },
  { type: 'min',   semitones: [0, 3, 7],         symbol: 'm' },
  { type: 'dom7',  semitones: [0, 4, 7, 10],     symbol: '7' },
  { type: 'maj7',  semitones: [0, 4, 7, 11],     symbol: 'maj7' },
  { type: 'min7',  semitones: [0, 3, 7, 10],     symbol: 'm7' },
  { type: 'dim',   semitones: [0, 3, 6],         symbol: 'dim' },
  { type: 'dim7',  semitones: [0, 3, 6, 9],      symbol: 'dim7' },
  { type: 'hdim7', semitones: [0, 3, 6, 10],     symbol: 'm7b5' },
  { type: 'aug',   semitones: [0, 4, 8],         symbol: 'aug' },
  { type: 'sus2',  semitones: [0, 2, 7],         symbol: 'sus2' },
  { type: 'sus4',  semitones: [0, 5, 7],         symbol: 'sus4' },
  { type: 'maj6',  semitones: [0, 4, 7, 9],      symbol: '6' },
  { type: 'min6',  semitones: [0, 3, 7, 9],      symbol: 'm6' },
  { type: 'add9',  semitones: [0, 4, 7, 14],     symbol: 'add9' },
  { type: 'madd9', semitones: [0, 3, 7, 14],     symbol: 'madd9' },
]

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/**
 * 從音名集合辨識所有符合的和弦
 *
 * @param {Set<string>|string[]} pitchClasses  音名集合（不含八度），如 Set(['A','C','E'])
 * @returns {Array<{
 *   root: string,
 *   type: string,
 *   symbol: string,
 *   name: string,       // 如 'Am'、'Cmaj7'
 *   missing: string[],  // 型態需要但輸入中缺少的音（允許不完整和弦）
 * }>}
 */
export function detectChord(pitchClasses) {
  const pcs = new Set([...pitchClasses].map(n => n))
  const results = []

  for (const root of CHROMATIC) {
    const rootSemitone = noteToSemitone(root)

    for (const pattern of CHORD_PATTERNS) {
      // 將型態音程轉成以 C 為基準的音名
      const patternNotes = pattern.semitones.map(s =>
        CHROMATIC[((rootSemitone + s) % 12 + 12) % 12]
      )

      // 計算吻合數與缺少音
      const matched = patternNotes.filter(n => pcs.has(n))
      const missing = patternNotes.filter(n => !pcs.has(n))

      // 至少要有根音，且吻合率 >= 2/3
      if (!pcs.has(root)) continue
      if (matched.length < Math.ceil(patternNotes.length * 2 / 3)) continue

      results.push({
        root,
        type: pattern.type,
        symbol: pattern.symbol,
        name: `${root}${pattern.symbol}`,
        missing,
        score: matched.length - missing.length * 0.5,
      })
    }
  }

  // 分數高的排前面（吻合越完整越優先）
  results.sort((a, b) => b.score - a.score)

  return results
}

/**
 * 以指定根音計算各音的音程（簡單 + 複合）
 *
 * @param {Array<{ note: string, octave: number }>} noteObjs  含八度的音符陣列（低到高）
 * @param {string} root  根音音名，如 'A'
 * @returns {Array<{
 *   note: string,
 *   octave: number,
 *   simpleName: string,    // 如 'P5'
 *   compoundName: string,  // 如 'P12'（跨八度時）
 *   semitones: number,     // 距根音的實際半音數
 * }>}
 */
export function getIntervals(noteObjs, root) {
  if (!noteObjs.length) return []

  // 找出根音的最低出現位置作為基準
  const rootObjs = noteObjs.filter(n => n.note === root)
  const baseObj = rootObjs.length ? rootObjs[0] : noteObjs[0]
  const baseAbs = toAbsoluteSemitone(baseObj.note, baseObj.octave)

  return noteObjs.map(n => {
    const abs = toAbsoluteSemitone(n.note, n.octave)
    const { semitones, simpleName, compoundName } = calcInterval(baseAbs, abs)
    return { note: n.note, octave: n.octave, simpleName, compoundName, semitones }
  })
}
