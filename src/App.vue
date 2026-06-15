<template>
  <div class="app">
    <ChordChart width="200px" @change="onChordChange" />
    組成音：{{ pitchClassesList }}
    <div class="chord-result">
      <template v-if="chordResult.length">
        <span class="chord-name">{{ chordResult[0].name }}</span>
        <span v-if="chordResult.length > 1" class="chord-alt">
          也可能是 {{ chordResult.slice(1, 3).map(c => c.name).join('、') }}
        </span>
        <span class="chord-alt">
          根音{{ chordResult[0].root }}
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
const noteObjs = ref([])

// pitchClasses：去除八度的音名集合，只需要「有哪些音」，例如 Set(['E', 'A', 'D'])。
const pitchClasses = ref(new Set(['E','A','D','G','B']))
const pitchClassesList = computed(() => [...pitchClasses.value].join('、'))

// 只要有任何音（即使只有一個音），就顯示「無法辨識」提示
const hasNotes = computed(() => pitchClasses.value.size > 0)

// 和弦辨識結果（已依分數由高到低排序）
// - 少於 2 個不同音名時不嘗試辨識（單音無法構成和弦）
// - detectChord 回傳所有符合條件的候選，第 0 筆為最佳匹配
const chordResult = computed(() => {
  if (pitchClasses.value.size < 2) return []
  return detectChord(pitchClasses.value)
})

// ChordChart 每次使用者點格子或切換靜音時都會 emit change
// strings：boolean[6]，false 表示該弦靜音（index 0 = 第6弦低音E）
// cells：[{ string, fret }]，string 為 1–6（1 = 最細的高音e）
// chartToNotes 內部會把靜音弦過濾掉，並將弦編號轉為正確的 stringIndex
function onChordChange({ strings, cells }) {
  const result = chartToNotes(strings, cells)
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
