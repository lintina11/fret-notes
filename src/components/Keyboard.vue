<template>
  <div class="keyboard">
    <div class="keyboard-container">
      <div class="keyboard-keys" aria-label="Piano keyboard from C to high C">
        <div class="white-keys">
          <button
            v-for="key in whiteKeys"
            :key="key.note"
            class="keyboard-key white-key"
            type="button"
          >
            {{ key.note }}
          </button>
        </div>

        <div class="black-keys">
          <button
            v-for="key in blackKeys"
            :key="key.note"
            class="keyboard-key black-key"
            :style="{ left: `${key.position}%` }"
            type="button"
          >
            {{ key.note }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const whiteKeys = [
  { note: 'C' },
  { note: 'D' },
  { note: 'E' },
  { note: 'F' },
  { note: 'G' },
  { note: 'A' },
  { note: 'B' },
  { note: 'C' },
]

const blackKeys = [
  { note: 'C#', position: 12.5 },
  { note: 'D#', position: 25 },
  { note: 'F#', position: 50 },
  { note: 'G#', position: 62.5 },
  { note: 'A#', position: 75 },
]
</script>

<style scoped lang="scss">
.keyboard {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
}

.keyboard-container {
  width: min(100%, 760px);
}

.keyboard-keys {
  --white-key-count: 8;
  --black-key-width: 8%;

  position: relative;
  width: 100%;
  min-height: 220px;
  margin-top: 16px;
}

.white-keys {
  display: grid;
  grid-template-columns: repeat(var(--white-key-count), minmax(0, 1fr));
  height: 220px;
}

.black-keys {
  position: absolute;
  inset: 0;
  height: 62%;
  pointer-events: none;
}

.keyboard-key {
  border: 1px solid var(--border);
  font: inherit;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    transform 0.15s ease;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.white-key {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 16px;
  color: var(--text-h);
  background: #fff;
  border-radius: 0 0 6px 6px;

  &:hover {
    background: #f6f5f8;
  }
}

.black-key {
  position: absolute;
  top: 0;
  width: var(--black-key-width);
  height: 100%;
  transform: translateX(-50%);
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;
  color: #fff;
  background: #111;
  border-color: #000;
  border-radius: 0 0 5px 5px;
  pointer-events: auto;

  &:hover {
    background: #2a2a2a;
  }
}

@media (max-width: 640px) {
  .keyboard-keys {
    --black-key-width: 10%;

    min-height: 160px;
  }

  .white-keys {
    height: 160px;
  }

  .keyboard-key {
    font-size: 14px;
  }
}
</style>
