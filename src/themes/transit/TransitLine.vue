<script setup lang="ts">
import { ref, onMounted, onUnmounted, type ComponentPublicInstance } from 'vue'
import { stops, lineNameFor } from './route'
import { yearsRunning, openedYear } from '../../data/career'

const routeEl = ref<HTMLElement | null>(null)
const dotEls = ref<Array<HTMLElement | null>>([])

const progress = ref(0)
const activeIndex = ref(0)
const seen = ref<number[]>([])

const railTop = ref(0)
const railHeight = ref(0)
/** Each station's position along the rail, 0–1. Measured, because cards are different heights. */
const offsets = ref<number[]>([])

let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let frame = 0

const setDot = (el: Element | ComponentPublicInstance | null, index: number) => {
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
  progress.value = Math.min(1, Math.max(0, raw))

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
      :style="{ '--p': progress, '--rail-top': `${railTop}px`, '--rail-h': `${railHeight}px` }"
    >
      <span class="tm-route__casing" aria-hidden="true"></span>
      <span class="tm-route__live" aria-hidden="true"></span>
      <span class="tm-route__train" aria-hidden="true"></span>

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
