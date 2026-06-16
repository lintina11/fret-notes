<template>
  <div class="app">
    <ChordChart width="200px" @change="onChordChange" />
    {{ pitchClassesList }}
    <div class="chord-result">
      <template v-if="chordResultFormatted.length">
        <span v-for="c in primaryChords" :key="c.name" class="chord-name">
          {{ c.displayName }}
        </span>
        <span v-if="altChords.length" class="chord-alt">
          也可能是 {{ altChords.map(c => c.displayName).join('、') }}
        </span>
      </template>
      <span v-else-if="!hasNotes" class="chord-unknown">無法辨識和弦</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ChordChart from './components/ChordChart.vue'
import { chartToNotes } from './music/guitar.js'
import { detectChord } from './music/chords.js'

// noteObjs：含八度資訊的完整音符陣列，例如 [{ note: 'E', octave: 2, stringIndex: 0, fret: 0 }, ...]
// chartToNotes 已依絕對音高由低到高排序，所以 noteObjs[0] 永遠是最低音
const noteObjs = ref([])

// pitchClasses：去除八度的音名集合，只需要「有哪些音」，例如 Set(['E', 'A', 'D'])。
const pitchClasses = ref(new Set(['E','A','D','G','B']))
const pitchClassesList = computed(() => [...pitchClasses.value].join('、'))

// 只要有任何音（即使只有一個音），就顯示「無法辨識」提示
const hasNotes = computed(() => pitchClasses.value.size > 0)

// 最低音（bass note）：從排序後的 noteObjs[0] 取得音名
// 用於判斷是否為轉位和弦（root ≠ bass）
const bassNote = computed(() => noteObjs.value[0]?.note ?? null)

// 和弦辨識結果（已依分數由高到低排序）
// - 少於 2 個不同音名時不嘗試辨識（單音無法構成和弦）
// - detectChord 回傳所有符合條件的候選，第 0 筆為最佳匹配
const chordResult = computed(() => {
  if (pitchClasses.value.size < 2) return []
  return detectChord(pitchClasses.value)
})

// 加上 slash chord 顯示名稱，分數排序維持 detectChord 原本結果不變
// - root === bass：根音位置，displayName 同 name（例如 'Am'）
// - root !== bass：轉位，displayName 加上 /bass（例如 'Am/C'）
const chordResultFormatted = computed(() => {
  const bass = bassNote.value
  return chordResult.value.map(c => ({
    ...c,
    displayName: c.root === bass ? c.name : `${c.name}/${bass}`,
    isInversion: c.root !== bass,
  }))
})

// 完全吻合（無缺音 且 無多餘音）→ chord-name 全部列出
// 有缺音或有多餘音 → 下放到 chord-alt，最多顯示 2 個
const primaryChords = computed(() =>
  chordResultFormatted.value.filter(c => c.missing.length === 0 && c.extra.length === 0)
)
const altChords = computed(() =>
  chordResultFormatted.value.filter(c => c.missing.length > 0 || c.extra.length > 0).slice(0, 2)
)

// ChordChart 每次使用者點格子、切換靜音或調整封閉指法時都會 emit change
// strings：boolean[6]，false 表示該弦靜音（index 0 = 第6弦低音E）
// cells：[{ string, fret }]，string 為 1–6（1 = 最細的高音e）
// barre：{ width } 或 null，封閉指法涵蓋第 1～width 弦（右邊界固定在第1弦）
// chartToNotes 內部會把靜音弦過濾掉，並將弦編號轉為正確的 stringIndex
function onChordChange({ strings, cells, barre }) {
  const result = chartToNotes(strings, cells, 0, barre)
  noteObjs.value = result.noteObjs
  pitchClasses.value = result.pitchClasses
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
}

.chord-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 48px;
}

.chord-name {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.chord-alt {
  font-size: 0.85rem;
  color: #888;
}

.chord-unknown {
  font-size: 1rem;
  color: #aaa;
}
</style>
