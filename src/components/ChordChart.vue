<template>
	<div class="chord-chart">
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
						@click="handleCellClick(index)"
					>
						<span v-if="isPressed(index)" class="dot" />
					</div>
				</template>
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
	emitChange()
}

function emitChange() {
	emit('change', {
		strings: [...stringStatus],
		cells: pressedCells.value
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

function isPressed(index) {
  return pressedCells.value.some(p => p.index === index)
}

// 點擊 cell 時：記錄座標、新增紅點；重複點擊則移除；最多五個
function handleCellClick(index) {
  const existing = pressedCells.value.findIndex(p => p.index === index)
  if (existing !== -1) {
    pressedCells.value.splice(existing, 1)
  } else if (pressedCells.value.length < 5) {
    pressedCells.value.push({ index, ...getCellPosition(index) })
  }
	emitChange()
}



</script>
<style scoped lang="scss">
.chord-chart {
	.string-row,
	.fret-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
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