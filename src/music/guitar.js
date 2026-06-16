import { transposeNote, toAbsoluteSemitone, fromAbsoluteSemitone } from './notes.js'

/**
 * 標準調弦，index 0 = 第 6 弦（低音 E），index 5 = 第 1 弦（高音 e）
 * 格式：{ note, octave }
 */
export const STANDARD_TUNING = [
  { note: 'E', octave: 2 },
  { note: 'A', octave: 2 },
  { note: 'D', octave: 3 },
  { note: 'G', octave: 3 },
  { note: 'B', octave: 3 },
  { note: 'E', octave: 4 },
]

/**
 * 單一弦 + 品格 + Capo → { note, octave }
 *
 * @param {number} stringIndex  0–5，0 = 第6弦
 * @param {number} fret         0 = 空弦，1–n = 實際按格
 * @param {number} capo         移調夾位置（0 = 不加）
 * @param {Array}  tuning       自訂調弦，預設 STANDARD_TUNING
 */
export function fretToNoteObj(stringIndex, fret, capo = 0, tuning = STANDARD_TUNING) {
  const open = tuning[stringIndex]
  const absOpen = toAbsoluteSemitone(open.note, open.octave)
  const absFretted = absOpen + capo + fret
  return fromAbsoluteSemitone(absFretted)
}

/**
 * 將 ChordChart emit 出來的資料轉成音符陣列
 *
 * @param {string[]} strings  長度 6，值為 'O'（開放）或 'X'（靜音）
 *                            index 0 = 第6弦（低音），對應 ChordChart 左側
 * @param {Array}    cells    [{ string, fret }]，string 1–6（1 = 高音 e）
 * @param {number}   capo     移調夾
 * @param {{ width: number } | null} barre  封閉指法。width 為涵蓋弦數（右邊界固定在第1弦），
 *                                            例如 width=4 代表封閉第 1～4 弦；null 表示未使用封閉指法
 *
 * @returns {{
 *   noteObjs: Array<{ note: string, octave: number, stringIndex: number, fret: number }>,
 *   pitchClasses: Set<string>
 * }}
 */
export function chartToNotes(strings, cells, capo = 0, barre = null) {
  const noteObjs = []

  // cells 的 string 欄位：1 = 高音 e（第1弦） → stringIndex = 5
  for (const cell of cells) {
    const stringIndex = 6 - cell.string  // 轉成 0-based index（第6弦 = 0）
    if (!strings[stringIndex]) continue

    const { note, octave } = fretToNoteObj(stringIndex, cell.fret, capo)
    noteObjs.push({ note, octave, stringIndex, fret: cell.fret })
  }

  // 補上沒有明確按格的弦：悶音 > 明確按格 > 封閉指法（fret 1）> 真正空弦（fret 0）
  const pressedStrings = new Set(cells.map(c => 6 - c.string))
  for (let i = 0; i < 6; i++) {
    if (!strings[i]) continue
    if (pressedStrings.has(i)) continue

    const stringNumber = 6 - i  // 還原成 1~6（1 = 高音 e）
    const isBarred = barre && stringNumber <= barre.width
    const fret = isBarred ? 1 : 0

    const { note, octave } = fretToNoteObj(i, fret, capo)
    noteObjs.push({ note, octave, stringIndex: i, fret })
  }

  // 依絕對音高排序（低到高）
  noteObjs.sort((a, b) =>
    toAbsoluteSemitone(a.note, a.octave) - toAbsoluteSemitone(b.note, b.octave)
  )

  const pitchClasses = new Set(noteObjs.map(n => n.note))

  return { noteObjs, pitchClasses }
}
