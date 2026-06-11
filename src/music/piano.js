import { toAbsoluteSemitone, fromAbsoluteSemitone } from './notes.js'

/**
 * 鋼琴鍵盤的起始音，標準 88 鍵從 A0 開始
 * 這裡預設從 C2 開始顯示，涵蓋吉他常用音域
 */
export const DEFAULT_START = { note: 'A', octave: 0 }
export const DEFAULT_KEY_COUNT = 88

/**
 * 產生鍵盤的所有鍵資料
 *
 * @param {{ note: string, octave: number }} start  起始音
 * @param {number} count  總鍵數
 * @returns {Array<{ note: string, octave: number, isBlack: boolean, absIndex: number }>}
 */
export function buildKeyboard(start = DEFAULT_START, count = DEFAULT_KEY_COUNT) {
  const BLACK_NOTES = new Set(['C#', 'D#', 'F#', 'G#', 'A#'])
  const startAbs = toAbsoluteSemitone(start.note, start.octave)

  return Array.from({ length: count }, (_, i) => {
    const abs = startAbs + i
    const { note, octave } = fromAbsoluteSemitone(abs)
    return {
      note,
      octave,
      isBlack: BLACK_NOTES.has(note),
      absIndex: abs,
    }
  })
}

/**
 * 從 Keyboard 元件的「按下鍵索引集合」轉成音符陣列
 *
 * @param {Set<number>|number[]} pressedAbsIndices  被按下的 absIndex 集合
 * @returns {{
 *   noteObjs: Array<{ note: string, octave: number, absIndex: number }>,
 *   pitchClasses: Set<string>
 * }}
 */
export function pressedToNotes(pressedAbsIndices) {
  const indices = [...pressedAbsIndices].sort((a, b) => a - b)

  const noteObjs = indices.map(abs => ({
    ...fromAbsoluteSemitone(abs),
    absIndex: abs,
  }))

  const pitchClasses = new Set(noteObjs.map(n => n.note))

  return { noteObjs, pitchClasses }
}
