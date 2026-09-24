<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { app } from '@/state/app'

/**
 * Solari-style split-flap readout. Each cell riffles through a few characters before
 * landing on its target, staggered left to right. Screen readers get the plain text.
 */
const props = withDefaults(defineProps<{ text: string; cells?: number; tone?: 'light' | 'signal' }>(), {
  cells: 0,
  tone: 'light',
})

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·'
const normalise = (t: string) => {
  const upper = t.toUpperCase()
  return props.cells ? upper.padEnd(props.cells, ' ').slice(0, props.cells) : upper
}

const shown = ref<string[]>(normalise(props.text).split(''))
const flipping = ref<boolean[]>(shown.value.map(() => false))
let timers: number[] = []

function clear() {
  timers.forEach(clearTimeout)
  timers = []
}

function animateTo(target: string) {
  clear()
  const chars = target.split('')
  if (app.reducedMotion) {
    shown.value = chars
    flipping.value = chars.map(() => false)
    return
  }
  // Grow/shrink the board first so every cell has somewhere to land.
  while (shown.value.length < chars.length) shown.value.push(' ')
  shown.value.length = chars.length
  flipping.value = chars.map(() => false)

  chars.forEach((ch, i) => {
    if (shown.value[i] === ch) return
    const riffles = ch === ' ' ? 1 : 2 + ((i * 7) % 3)
    for (let k = 0; k <= riffles; k++) {
      const at = i * 28 + k * 62
      timers.push(
        window.setTimeout(() => {
          shown.value[i] = k === riffles ? ch : CHARSET[(i * 11 + k * 5 + ch.charCodeAt(0)) % CHARSET.length]
          flipping.value[i] = true
          timers.push(window.setTimeout(() => (flipping.value[i] = false), 55))
        }, at),
      )
    }
  })
}

watch(
  () => props.text,
  (t) => animateTo(normalise(t)),
)

onBeforeUnmount(clear)
</script>

<template>
  <span class="flap" :class="`flap--${tone}`">
    <span class="sr-only">{{ text }}</span>
    <span class="flap__cells" aria-hidden="true">
      <span
        v-for="(ch, i) in shown"
        :key="i"
        class="flap__cell"
        :class="{ 'is-space': ch === ' ', 'is-flip': flipping[i] }"
        ><span class="flap__glyph">{{ ch === ' ' ? ' ' : ch }}</span></span
      >
    </span>
  </span>
</template>

<style scoped lang="scss">
.flap {
  display: inline-flex;
  font-family: var(--font-mono);
  font-weight: 500;
  line-height: 1;
}

.flap__cells {
  display: inline-flex;
  gap: 0.12em;
}

.flap__cell {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 0.92em;
  height: 1.36em;
  border-radius: 0.14em;
  background: linear-gradient(180deg, #1a2231 0 49%, #121926 51% 100%);
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.06) inset,
    0 -1px 0 rgb(0 0 0 / 0.5) inset;
  overflow: hidden;

  // The hinge line across the middle of every flap.
  &::after {
    content: '';
    position: absolute;
    inset: 50% 0 auto;
    height: 1px;
    background: rgb(0 0 0 / 0.55);
  }

  &.is-space {
    background: linear-gradient(180deg, #151c29 0 49%, #0f1520 51% 100%);
  }
}

.flap__glyph {
  display: block;
  transform-origin: 50% 50%;
}

.flap--light .flap__glyph {
  color: var(--text);
}

.flap--signal .flap__glyph {
  color: var(--signal);
}

.is-flip .flap__glyph {
  animation: flap-riffle 55ms linear;
}

@keyframes flap-riffle {
  0% {
    transform: scaleY(1);
    filter: brightness(1);
  }
  50% {
    transform: scaleY(0.08);
    filter: brightness(0.5);
  }
  100% {
    transform: scaleY(1);
    filter: brightness(1);
  }
}
</style>
