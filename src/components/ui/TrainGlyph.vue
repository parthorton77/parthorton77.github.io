<script lang="ts">
let counter = 0
</script>

<script setup lang="ts">
/** Side-view of the Line P train in SVG — used by the 2.5D scenes and the career timeline. */
withDefaults(defineProps<{ cars?: number; spinning?: boolean }>(), { cars: 3, spinning: false })
// Each instance needs its own gradient id; duplicates can blank out in some browsers.
const gradientId = `train-body-${++counter}`
</script>

<template>
  <svg class="train" :class="{ 'is-spinning': spinning }" :viewBox="`0 0 ${cars * 64 + 16} 40`" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f4f6fa" />
        <stop offset="0.6" stop-color="#dfe4ec" />
        <stop offset="1" stop-color="#bfc7d3" />
      </linearGradient>
    </defs>
    <g v-for="i in cars" :key="i" :transform="`translate(${(cars - i) * 64 + 2} 0)`">
      <!-- lead car gets the nose (on the right) -->
      <path
        v-if="i === 1"
        d="M4 8h36c10 0 17 6 20 15v5c0 2-1.5 3.5-3.5 3.5H4c-2 0-3.5-1.5-3.5-3.5V11.5C.5 9.5 2 8 4 8Z"
        :fill="`url(#${gradientId})`"
      />
      <rect v-else x="0.5" y="8" width="60" height="23.5" rx="4" :fill="`url(#${gradientId})`" />
      <rect :x="i === 1 ? 6 : 6" y="12.5" :width="i === 1 ? 30 : 48" height="7" rx="2" fill="#0d121d" />
      <rect :x="i === 1 ? 8 : 8" y="13.6" :width="i === 1 ? 26 : 44" height="4.6" rx="1.4" fill="#f1c486" opacity="0.55" />
      <path v-if="i === 1" d="M41 12.5h6c4 0 7.5 3 9 7H41Z" fill="#0d121d" />
      <rect x="0.5" y="23.5" :width="i === 1 ? 50 : 60" height="1.4" fill="#ffb547" />
      <rect x="2" y="28" :width="i === 1 ? 54 : 57" height="3.5" rx="1.5" fill="#2a3140" />
      <circle v-if="i === 1" cx="57.6" cy="26" r="1.6" fill="#fff4dc" />
      <g class="train__wheels" fill="#1b212c" stroke="#aeb8c8" stroke-width="1">
        <g v-for="x in [11, 22, 40, 51]" :key="x" :transform="`translate(${x} 33.5)`">
          <circle r="4" />
          <path d="M-3.2 0h6.4" stroke="#e3e8ef" stroke-width="1.2" />
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped lang="scss">
.train {
  display: block;
  overflow: visible;
}

.train__wheels path {
  transform-box: fill-box;
}

.is-spinning .train__wheels g path {
  animation: wheel 0.5s linear infinite;
}

@keyframes wheel {
  to {
    transform: rotate(360deg);
  }
}
</style>
