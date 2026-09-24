<script setup lang="ts">
import { ref, onMounted, onUnmounted, type ComponentPublicInstance } from 'vue'
import { stops, lineNameFor } from './route'
import { yearsRunning, openedYear } from '../../data/career'

const routeEl = ref<HTMLElement | null>(null)
const dotEls = ref<Array<HTMLElement | null>>([])

const progress = ref(0)
const activeIndex = ref(0)
const seen = ref<number[]>([])
/** True while the train is actually changing position — drives wheels, rumble and steam. */
const moving = ref(false)

const railTop = ref(0)
const railHeight = ref(0)
/** Each station's position along the rail, 0–1. Measured, because cards are different heights. */
const offsets = ref<number[]>([])

let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let frame = 0
let settle = 0

/** Wheel positions on the 24×56 train drawing — carriage first, then the locomotive. */
const wheelRows = [6, 14, 30, 38, 46]
/** Tread marks that scroll across the wheels; one extra row above so the loop is seamless. */
const treads = Array.from({ length: 26 }, (_, i) => 2 + i * 2)

const setDot =(el: Element | ComponentPublicInstance | null, index: number) => {
  dotEls.value[index] = el instanceof HTMLElement ? el : null
}

const measure = () => {
  const route = routeEl.value
  const dots = dotEls.value.filter((dot): dot is HTMLElement => Boolean(dot))
  if (!route || dots.length < 2) return

  const base = route.getBoundingClientRect().top
  const centers = dots.map(dot => {
    const rect = dot.getBoundingClientRect()
    return rect.top + rect.height / 2 - base
  })

  railTop.value = centers[0]
  railHeight.value = centers[centers.length - 1] - centers[0]
  offsets.value = centers.map(center => (center - railTop.value) / (railHeight.value || 1))
  update()
}

const update = () => {
  const route = routeEl.value
  if (!route || !railHeight.value) return

  // The train sits where the rail crosses the middle of the viewport.
  const anchor = window.innerHeight * 0.5
  const railStart = route.getBoundingClientRect().top + railTop.value
  const raw = (anchor - railStart) / railHeight.value
  const next = Math.min(1, Math.max(0, raw))

  // Clamped at either terminus the value stops changing, so the train comes to rest there too.
  if (next !== progress.value) {
    moving.value = true
    clearTimeout(settle)
    settle = window.setTimeout(() => { moving.value = false }, 220)
  }
  progress.value = next

  let index = 0
  offsets.value.forEach((offset, i) => {
    if (progress.value >= offset - 0.02) index = i
  })
  activeIndex.value = index
}

const onScroll = () => {
  if (frame) return
  frame = requestAnimationFrame(() => { frame = 0; update() })
}

onMounted(() => {
  measure()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', measure)
  document.fonts?.ready.then(measure).catch(() => { /* font metrics are a nicety, not a requirement */ })

  if (routeEl.value) {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(routeEl.value)

    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const index = Number((entry.target as HTMLElement).dataset.index)
        if (!seen.value.includes(index)) seen.value.push(index)
        observer?.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.15 })

    routeEl.value.querySelectorAll('.tm-stop').forEach(stop => observer?.observe(stop))
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', measure)
  if (frame) cancelAnimationFrame(frame)
  clearTimeout(settle)
  observer?.disconnect()
  resizeObserver?.disconnect()
})
</script>

<template>
  <section id="journey" class="tm-section tm-line">
    <header class="tm-head">
      <p class="tm-eyebrow"><i aria-hidden="true"></i>Line 1 · the main route</p>
      <h2>{{ yearsRunning }} years,<br /><span class="tm-underline">one continuous line.</span></h2>
      <p class="tm-head__note">
        The route opened in {{ openedYear }} at a design desk and has been running ever since. Every station is a role;
        every interchange is a new set of tools picked up along the way.
      </p>
    </header>

    <div
      ref="routeEl"
      class="tm-route"
      :style="{
        '--p': progress,
        '--rail-top': `${railTop}px`,
        '--rail-h': `${railHeight}px`,
        '--train': `var(--line-${stops[activeIndex]?.line ?? 'now'})`
      }"
    >
      <span class="tm-route__casing" aria-hidden="true"></span>
      <span class="tm-route__live" aria-hidden="true"></span>

      <!-- Seen from above, heading down the line: carriage behind, locomotive in front. -->
      <span class="tm-route__train" :class="{ 'is-moving': moving }" aria-hidden="true">
        <svg class="tm-train" viewBox="0 0 24 56" focusable="false">
          <defs>
            <clipPath id="tm-train-wheels">
              <rect v-for="y in wheelRows" :key="y" x="1.5" :y="y" width="21" height="4" rx="1" />
            </clipPath>
          </defs>

          <rect v-for="y in wheelRows" :key="y" class="tm-train__wheel" x="1.5" :y="y" width="21" height="4" rx="1" />
          <g clip-path="url(#tm-train-wheels)">
            <g class="tm-train__treads">
              <rect v-for="y in treads" :key="y" x="1.5" :y="y" width="21" height=".8" />
            </g>
          </g>

          <rect class="tm-train__body" x="4" y="2" width="16" height="19" rx="3.5" />
          <rect class="tm-train__roof" x="7" y="5" width="10" height="13" rx="2" />
          <rect class="tm-train__coupler" x="10.5" y="20.5" width="3" height="4" rx=".8" />

          <path class="tm-train__body" d="M4 28a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v19c0 4-3.6 7-8 7s-8-3-8-7z" />
          <rect class="tm-train__roof" x="5.5" y="25.5" width="13" height="9" rx="2" />
          <rect class="tm-train__boiler" x="7" y="36" width="10" height="14.5" rx="5" />
          <circle class="tm-train__chimney" cx="12" cy="45" r="2.4" />
          <circle class="tm-train__glow" cx="12" cy="52.4" r="4" />
          <circle class="tm-train__lamp" cx="12" cy="52.4" r="1.4" />

          <!-- Drifts back over the train, only while it's running. -->
          <g class="tm-train__steam">
            <circle cx="12" cy="44" r="2.2" />
            <circle cx="12" cy="44" r="2.2" />
          </g>
        </svg>
      </span>

      <article
        v-for="(stop, index) in stops"
        :key="stop.company"
        class="tm-stop"
        :class="[`is-${stop.line}`, { 'is-seen': seen.includes(index), 'is-passed': index <= activeIndex, 'is-current': index === activeIndex }]"
        :data-index="index"
      >
        <p class="tm-stop__year">{{ stop.year }}</p>

        <div class="tm-stop__marker">
          <span :ref="el => setDot(el, index)" class="tm-stop__dot" :data-kind="stop.kind"></span>
        </div>

        <div class="tm-stop__card">
          <p class="tm-stop__meta">
            <span class="tm-line-chip">{{ lineNameFor(stop.line) }}</span>
            <em v-if="stop.kind === 'terminus'">Current terminus</em>
            <em v-else-if="stop.kind === 'origin'">Line opens</em>
          </p>
          <h3>{{ stop.role }}</h3>
          <p class="tm-stop__company">
            {{ stop.company }}<span v-if="stop.project"> — {{ stop.project }}</span>
          </p>
          <p class="tm-stop__summary">{{ stop.summary }}</p>
          <ul class="tm-connections">
            <li class="tm-conn-label">Connections</li>
            <li v-for="item in stop.tech" :key="item">{{ item }}</li>
          </ul>
        </div>
      </article>
    </div>
  </section>
</template>
