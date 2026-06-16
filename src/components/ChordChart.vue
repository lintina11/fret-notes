<template>
	<div class="chord-chart">
		<div class="barre-controls">
			<button
				type="button"
				class="barre-toggle"
				:class="{ active: barreActive }"
				@click="toggleBarre"
			>
				使用封閉
			</button>
			<template v-if="barreActive">
				<button type="button" :disabled="barreWidth >= 6" @click="moveBarreLeft">◀︎</button>
				<button type="button" :disabled="barreWidth <= 2" @click="moveBarreRight">▶︎</button>
			</template>
		</div>
		<div class="wrapper" :style="{ width }">
			<div class="string-row">
				<button
					v-for="(_, idx) in stringStatus"
					:key="idx"
					type="button"
					class="string-switch"
					@click="handleStringSwitchClick(idx)"
				>
					<span v-if="stringStatus[idx]" class="on"></span>
					<span v-else class="off"></span>
				</button>
			</div>
			<div class="fret-grid">
				<template v-for="index in 30" :key="index">
					<div
						class="cell"
						:class="[{ left: index % 6 === 1 }, { right: index % 6 === 0 }]"
						:style="getCellGridStyle(index)"
						@click="handleCellClick(index)"
					>
						<span v-if="isPressed(index)" class="dot" />
					</div>
				</template>
				<div
					v-if="barreActive"
					class="barre-bar"
					:style="{ gridColumn: `${7 - barreWidth} / 7`, gridRow: '1' }"
				/>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue'

defineProps({
	width: {
		type: String,
		default: '100%'
	}
})
const emit = defineEmits(['change'])

// 左到右對應第 6~1 弦，預設皆為空弦 (O)
const stringStatus = reactive([true, true, true, true, true, true])

function handleStringSwitchClick(idx) {
	stringStatus[idx] = !stringStatus[idx]

	// 弦被切換為靜音時，清除該弦上既有的按格紅點
	// idx 為左到右 0~5（對應第 6~1 弦），cell.string 為 1~6（1 = 高音 e），故轉換為 6 - idx
	if (!stringStatus[idx]) {
		const targetString = 6 - idx
		pressedCells.value = pressedCells.value.filter(p => p.string !== targetString)
	}

	emitChange()
}

// 封閉指法：固定按在 fret 1，width 為涵蓋弦數（右邊界固定在第1弦，最小寬度 2）
const barreActive = ref(false)
const barreWidth = ref(6)

function toggleBarre() {
	barreActive.value = !barreActive.value
	emitChange()
}

function moveBarreLeft() {
	if (barreWidth.value > 6) return
	barreWidth.value++
	emitChange()
}

function moveBarreRight() {
	if (barreWidth.value <= 2) return
	barreWidth.value--
	emitChange()
}

function emitChange() {
	emit('change', {
		strings: [...stringStatus],
		cells: pressedCells.value,
		barre: barreActive.value ? { width: barreWidth.value } : null
	})
}

// 紀錄已按下的 cell 位置 (最大五個)
const pressedCells = ref([])

/**
 * 取得 cell 的位置 (string: 1~30, 轉成 fret 與 string)
 * 假設一行有 6 個字：string 1~6 = fret 1 的 6~1 弦, string 7~12 = fret 2，以此類推
 * 回傳格式: { fret, string }
 */
function getCellPosition(index) {
  // index 1~30
  const fret = Math.ceil(index / 6) // 1~5
  const string = 7 - (index % 6 === 0 ? 6 : index % 6) // 6~1 (弦：左到右)
  return { fret, string }
}

/**
 * 將 cell 明確指定 grid 座標，避免 auto-placement 因 barre-bar 佔位而跑版
 * column 1~6（左到右），row 即 fret（1~5）
 */
function getCellGridStyle(index) {
  const { fret } = getCellPosition(index)
  const column = index % 6 === 0 ? 6 : index % 6
  return { gridColumn: String(column), gridRow: String(fret) }
}

function isPressed(index) {
  return pressedCells.value.some(p => p.index === index)
}

// 點擊 cell 時：記錄座標、新增紅點；重複點擊則移除；最多五個
// 同一根弦最多只會發出一個音，新點擊的格子一律覆蓋該弦上既有的按格
function handleCellClick(index) {
  const existing = pressedCells.value.findIndex(p => p.index === index)
  if (existing !== -1) {
    pressedCells.value.splice(existing, 1)
    emitChange()
    return
  }

  if (pressedCells.value.length >= 5) return

  const cell = { index, ...getCellPosition(index) }
  const sameStringIdx = pressedCells.value.findIndex(p => p.string === cell.string)

  if (sameStringIdx !== -1) {
    pressedCells.value.splice(sameStringIdx, 1, cell)
  } else {
    pressedCells.value.push(cell)
  }

	emitChange()
}



</script>
<style scoped lang="scss">
.chord-chart {
	.barre-controls {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;

		button {
			cursor: pointer;
		}
	}

	.string-row,
	.fret-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
	}

	.fret-grid {
		position: relative;
	}

	.barre-bar {
		grid-row: 1;
		align-self: center;
		height: 60%;
		margin: 0 4px;
		background-color: rgba(255, 99, 99, 0.4);
		border-radius: 999px;
		pointer-events: none;
		z-index: 1;
	}

	.string-switch {
		border: none;
		background: transparent;
		color: #333;
		cursor: pointer;
		padding: 10%;
		transition: color 0.15s ease, background-color 0.15s ease;

		span.on{
			&:after{
				content: "\25ef"
			}
		}
		span.off{
			&:after{
				content: "\2573"
			}
		}

		&:hover {
			background-color: rgba(255, 192, 203, 0.35);
		}
	}

	.cell {
		aspect-ratio: 3/5;
		position: relative;
		&:before {
			content: '';
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 100%;
			border-top: 1px solid;
			border-bottom: 1px solid;
			// background-color: #aaa;
		}
		&:after {
			content: '';
			color: #555;
			position: absolute;
			top: 0;
			bottom: 0;
			left: 50%;
			width: 1px;
			background-color: #aaa;
		}
		&.left{
			&:before {
				left: 50%;
			}
		}
		&.right{
			&:before {
				right: 50%;
			}
		}
		&:hover {
			background-color: pink;
		}

		.dot {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 90%;
			aspect-ratio: 1;
			background-color: red;
			opacity: .5;
			border-radius: 50%;
			z-index: 1;
			pointer-events: none;
		}
	}
}
</style>