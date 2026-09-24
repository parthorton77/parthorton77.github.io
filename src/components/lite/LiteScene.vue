<script lang="ts">
let uidCounter = 0
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import TrainGlyph from '@/components/ui/TrainGlyph.vue'
import ProjectMotif from '@/components/stations/projects/ProjectMotif.vue'
import { app } from '@/state/app'
import { stationById, type StationId } from '@/data/stations'
import { projects } from '@/data/portfolio'

/**
 * The 2.5D journey for phones and "lite" mode: an SVG diorama per station. The train
 * pulls in as the station scrolls into view and departs as it leaves; skyline layers
 * drift at different speeds for parallax. Cheap: a few transforms per scroll frame.
 */
const props = defineProps<{ station: StationId; hero?: boolean }>()
const s = computed(() => stationById[props.station])
const uid = `lite-${++uidCounter}`

const root = ref<HTMLElement>()
const trainG = ref<SVGGElement>()
const farG = ref<SVGGElement>()
const midG = ref<SVGGElement>()
const moving = ref(false)

const STOP = 300
const W = 800

function rng(seed: number) {
  let x = seed
  return () => {
    x = (x * 16807) % 2147483647
    return (x - 1) / 2147483646
  }
}

function skyline(seed: number, minH: number, maxH: number, base: number) {
  const r = rng(seed)
  const out: { x: number; y: number; w: number; h: number }[] = []
  let x = -140
  while (x < W + 140) {
    const w = 26 + r() * 46
    const h = minH + r() * (maxH - minH)
    out.push({ x, y: base - h, w, h })
    x += w + 2 + r() * 10
  }
  return out
}

const seed = [...props.station].reduce((a, c) => a + c.charCodeAt(0), 7)
const far = skyline(seed, 50, 130, 238)
const mid = skyline(seed * 3, 26, 84, 240)
const stars = (() => {
  const r = rng(seed * 7)
  return Array.from({ length: 46 }, () => ({ x: r() * W, y: r() * 150, r: 0.5 + r() * 1.1, o: 0.3 + r() * 0.6 }))
})()

// ---- scroll choreography ----
let raf = 0
let visible = false
let lastX = STOP
let stillTimer = 0
let io: IntersectionObserver | null = null

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeIn = (t: number) => t * t * t
const clamp = (v: number) => Math.min(1, Math.max(0, v))

function update() {
  raf = 0
  const el = root.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight
  const p = clamp((vh - r.top) / (vh + r.height))
  let x = STOP
  if (!app.reducedMotion) {
    const depart = props.hero ? 0.56 : 0.62
    if (!props.hero && p < 0.42) x = -260 + (STOP + 260) * easeOut(clamp((p - 0.04) / 0.38))
    else if (p > depart) x = STOP + (W + 60 - STOP) * easeIn(clamp((p - depart) / (0.98 - depart)))
    farG.value?.setAttribute('transform', `translate(${((0.5 - p) * 40).toFixed(1)} 0)`)
    midG.value?.setAttribute('transform', `translate(${((0.5 - p) * 96).toFixed(1)} 0)`)
  }
  trainG.value?.setAttribute('transform', `translate(${x.toFixed(1)} 0)`)
  if (Math.abs(x - lastX) > 0.4) {
    moving.value = true
    window.clearTimeout(stillTimer)
    stillTimer = window.setTimeout(() => (moving.value = false), 160)
  }
  lastX = x
}

function onScroll() {
  if (visible && !raf) raf = requestAnimationFrame(update)
}

onMounted(() => {
  io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting)
    if (visible) onScroll()
  })
  if (root.value) io.observe(root.value)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  update()
})

onBeforeUnmount(() => {
  io?.disconnect()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  cancelAnimationFrame(raf)
  window.clearTimeout(stillTimer)
})

const colour = computed(() => s.value.color)
const techs = ['Vue.js', 'TypeScript', 'SCSS', 'React', 'Git']
</script>

<template>
  <div ref="root" class="lite" :class="[`lite--${station}`, { 'lite--hero': hero }]" :style="{ '--c': colour }" aria-hidden="true">
    <svg class="lite__svg" :viewBox="`0 0 ${W} 300`" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient :id="`${uid}-sky`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#03050b" />
          <stop offset="1" stop-color="#0c121e" />
        </linearGradient>
        <radialGradient :id="`${uid}-glow`" cx="0.5" cy="1" r="0.7">
          <stop offset="0" :stop-color="colour" stop-opacity="0.22" />
          <stop offset="1" :stop-color="colour" stop-opacity="0" />
        </radialGradient>
        <pattern :id="`${uid}-win`" width="9" height="11" patternUnits="userSpaceOnUse">
          <rect x="2" y="3" width="4" height="4" fill="#1a2232" />
        </pattern>
        <pattern :id="`${uid}-lit`" width="27" height="33" patternUnits="userSpaceOnUse">
          <rect x="2" y="3" width="4" height="4" fill="#ffcf93" opacity="0.8" />
          <rect x="20" y="14" width="4" height="4" fill="#bcd6ff" opacity="0.6" />
          <rect x="11" y="25" width="4" height="4" fill="#ffcf93" opacity="0.55" />
        </pattern>
        <linearGradient :id="`${uid}-beam`" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" :stop-color="colour" stop-opacity="0.55" />
          <stop offset="1" :stop-color="colour" stop-opacity="0" />
        </linearGradient>
      </defs>

      <rect width="800" height="300" :fill="`url(#${uid}-sky)`" />
      <g class="lite__stars">
        <circle v-for="(st, i) in stars" :key="i" :cx="st.x" :cy="st.y" :r="st.r" fill="#dfe8ff" :opacity="st.o" />
      </g>
      <g v-if="hero" class="lite__planet">
        <circle cx="520" cy="96" r="40" fill="#070a12" />
        <path d="M497 64a40 40 0 0 1 63 42" fill="none" stroke="#7fa8ff" stroke-width="2.2" opacity="0.75" />
      </g>
      <ellipse cx="400" cy="300" rx="420" ry="150" :fill="`url(#${uid}-glow)`" />

      <g ref="farG">
        <rect v-for="(b, i) in far" :key="`f${i}`" :x="b.x" :y="b.y" :width="b.w" :height="b.h" fill="#0c111b" />
        <rect v-for="(b, i) in far" :key="`fw${i}`" :x="b.x" :y="b.y + 4" :width="b.w" :height="b.h - 4" :fill="`url(#${uid}-lit)`" opacity="0.45" />
      </g>
      <g ref="midG">
        <rect v-for="(b, i) in mid" :key="`m${i}`" :x="b.x" :y="b.y" :width="b.w" :height="b.h" fill="#141c2a" />
        <rect v-for="(b, i) in mid" :key="`mw${i}`" :x="b.x" :y="b.y + 4" :width="b.w" :height="b.h - 4" :fill="`url(#${uid}-win)`" />
        <rect v-for="(b, i) in mid" :key="`ml${i}`" :x="b.x" :y="b.y + 4" :width="b.w" :height="b.h - 4" :fill="`url(#${uid}-lit)`" opacity="0.9" />
      </g>

      <!-- District set pieces -->
      <g class="lite__district">
        <template v-if="station === 'landing'">
          <rect x="226" y="164" width="384" height="7" rx="3" fill="#dce3ec" />
          <rect x="232" y="171" width="372" height="2" :fill="colour" />
          <rect v-for="x in [262, 420, 578]" :key="x" :x="x" y="173" width="3" height="66" fill="#283243" />
          <rect x="318" y="182" width="170" height="26" rx="5" fill="#0b1019" stroke="#34405a" />
          <rect x="324" y="187" width="16" height="16" rx="3" :fill="colour" />
          <text x="348" y="200" class="lite__sign">PARTH METRO</text>
          <!-- Tunnel portal the train departs into -->
          <path d="M650 262V190a58 58 0 0 1 116 0v72Z" fill="#0d121b" />
          <path d="M660 262V192a48 48 0 0 1 96 0v70" fill="#020306" :stroke="colour" stroke-width="2.5" />
        </template>

        <template v-else-if="station === 'profile'">
          <path v-for="(dx, i) in [0, 60, 120, 180]" :key="i" :d="`M${250 + dx} 250a92 92 0 0 1 ${184} 0`" fill="none" stroke="#dce3ec" stroke-width="3" :opacity="0.25 + i * 0.18" />
          <rect x="250" y="156" width="364" height="2" :fill="colour" opacity="0.7" />
          <rect x="650" y="90" width="30" height="150" fill="#141b27" />
          <circle cx="665" cy="112" r="11" fill="#0b1019" :stroke="colour" stroke-width="2" />
          <path d="M665 112v-6M665 112l5 3" stroke="#eef2f8" stroke-width="1.6" />
          <rect x="300" y="120" width="200" height="26" rx="5" fill="#0b1019" stroke="#34405a" />
          <rect x="306" y="125" width="16" height="16" rx="3" :fill="colour" />
          <text x="330" y="138" class="lite__sign">PARTH CENTRAL</text>
        </template>

        <template v-else-if="station === 'design'">
          <g v-for="(p, i) in [[150, 96, 110, 70], [290, 70, 90, 110], [410, 104, 120, 64], [560, 80, 84, 96]]" :key="i" class="lite__float" :style="{ animationDelay: `${i * -1.4}s` }">
            <rect :x="p[0]" :y="p[1]" :width="p[2]" :height="p[3]" rx="6" fill="rgb(14 20 32 / 0.8)" :stroke="colour" stroke-width="1.5" />
            <rect :x="p[0] + 10" :y="p[1] + 12" :width="p[2] * 0.5" height="6" rx="3" fill="#eef2f8" opacity="0.8" />
            <rect :x="p[0] + 10" :y="p[1] + 26" :width="p[2] - 20" height="4" rx="2" fill="#eef2f8" opacity="0.3" />
            <rect :x="p[0] + 10" :y="p[1] + p[3] - 20" width="34" height="10" rx="5" :fill="colour" />
          </g>
          <path d="M120 70C260 10 420 210 700 90" fill="none" :stroke="colour" stroke-width="2" />
          <rect x="115" y="65" width="10" height="10" fill="#eef2f8" />
          <rect x="695" y="85" width="10" height="10" fill="#eef2f8" />
          <text x="340" y="228" class="lite__sign lite__sign--flat">DESIGN DISTRICT</text>
        </template>

        <template v-else-if="station === 'engineering'">
          <g v-for="(t, i) in techs" :key="t">
            <rect :x="150 + i * 110" :y="240 - [96, 124, 84, 110, 70][i]" width="46" :height="[96, 124, 84, 110, 70][i]" fill="#141c2a" :stroke="colour" stroke-width="1.2" stroke-opacity="0.7" />
            <path v-for="y in 4" :key="y" :d="`M${150 + i * 110} ${240 - y * 22}h46`" :stroke="colour" stroke-opacity="0.35" />
            <rect :x="130 + i * 110" :y="226 - [96, 124, 84, 110, 70][i] - 12" width="86" height="20" rx="4" fill="#08101a" :stroke="colour" stroke-opacity="0.8" />
            <text :x="173 + i * 110" :y="226 - [96, 124, 84, 110, 70][i] + 2" text-anchor="middle" class="lite__label">{{ t }}</text>
          </g>
        </template>

        <template v-else-if="station === 'projects'">
          <g v-for="(p, i) in projects" :key="p.id">
            <polygon :points="`${218 + i * 160},226 ${282 + i * 160},226 ${300 + i * 160},120 ${200 + i * 160},120`" :fill="`url(#${uid}-beam)`" />
            <rect :x="214 + i * 160" y="224" width="72" height="16" rx="3" fill="#dce3ec" />
            <rect :x="214 + i * 160" y="222" width="72" height="3" :fill="colour" />
            <g class="lite__holo" :style="{ animationDelay: `${i * -1.1}s` }">
              <svg :x="222 + i * 160" y="130" width="56" height="56" viewBox="0 0 64 64">
                <ProjectMotif :motif="p.motif" :size="64" />
              </svg>
            </g>
          </g>
        </template>

        <template v-else-if="station === 'ai-lab'">
          <g transform="translate(400 240)">
            <path d="M-150 0a150 130 0 0 1 300 0" fill="none" :stroke="colour" stroke-opacity="0.6" stroke-width="1.5" />
            <path d="M-150 0a150 130 0 0 1 300 0" fill="rgb(83 224 194 / 0.04)" />
            <path v-for="k in [0.35, 0.65]" :key="k" :d="`M${-150 * (1 - k * 0.2)} ${-130 * k}h${300 * (1 - k * 0.2)}`" :stroke="colour" stroke-opacity="0.3" />
            <path v-for="k in [-100, -50, 0, 50, 100]" :key="k" :d="`M0 -130Q${k * 1.4} -70 ${k * 1.45} 0`" fill="none" :stroke="colour" stroke-opacity="0.25" />
            <circle cy="-66" r="30" fill="rgb(83 224 194 / 0.12)" />
            <circle cy="-66" r="18" fill="#0b2723" :stroke="colour" stroke-width="2" class="lite__core" />
            <ellipse cy="-66" rx="44" ry="12" fill="none" :stroke="colour" stroke-opacity="0.7" class="lite__orbit" />
          </g>
        </template>

        <template v-else-if="station === 'contact'">
          <rect x="560" y="120" width="12" height="120" fill="#dce3ec" />
          <rect x="690" y="120" width="12" height="120" fill="#dce3ec" />
          <rect x="554" y="112" width="154" height="14" fill="#dce3ec" />
          <rect x="566" y="88" width="130" height="20" rx="4" fill="#0b1019" stroke="#34405a" />
          <text x="631" y="102" text-anchor="middle" class="lite__sign lite__sign--small">FINAL STATION</text>
          <g stroke="#8e9bb0" stroke-width="1.2" fill="none">
            <path d="M150 240 172 60 194 240M156 190h32M161 140h22M166 100h12M156 190l27-50M161 140l17-40" />
          </g>
          <circle cx="172" cy="54" r="4" fill="#ff5050" class="lite__beacon" />
          <circle v-for="k in 3" :key="k" cx="172" cy="56" r="12" fill="none" stroke="#eef2f8" class="lite__ring" :style="{ animationDelay: `${k * 0.9}s` }" />
        </template>
      </g>

      <!-- Platform + track -->
      <rect x="222" y="240" width="392" height="14" fill="#1d2533" />
      <rect x="222" y="239" width="392" height="2" :fill="colour" />
      <rect x="0" y="262" width="800" height="3" fill="#8f9bb0" />
      <rect x="0" y="265" width="800" height="5" fill="#10151f" />

      <g ref="trainG" :transform="`translate(${STOP} 0)`">
        <TrainGlyph :cars="3" :spinning="moving" x="0" y="229" width="224" height="42" />
        <ellipse cx="226" cy="262" rx="26" ry="4" fill="#ffe2b0" opacity="0.35" />
      </g>
    </svg>
  </div>
</template>

<style scoped lang="scss">
.lite {
  position: relative;
  height: clamp(170px, 34vw, 300px);
  margin: 0 calc(var(--gutter) * -1) 18px;
  overflow: hidden;
  mask-image: linear-gradient(180deg, transparent, #000 18%, #000 90%, transparent);
}

.lite--hero {
  height: clamp(190px, 30svh, 320px);
  margin: 10px calc(var(--gutter) * -1) 6px;
}

.lite__svg {
  width: 100%;
  height: 100%;
}

.lite__sign {
  fill: #eef2f8;
  font-family: var(--font-display);
  font-size: 14px;
  font-stretch: 125%;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.lite__sign--flat {
  fill: var(--c);
  font-size: 13px;
  letter-spacing: 0.18em;
}

.lite__sign--small {
  font-size: 11px;
}

.lite__label {
  fill: #eaf6ff;
  font-family: var(--font-mono);
  font-size: 11px;
}

.lite__float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  50% {
    transform: translateY(-6px);
  }
}

.lite__holo {
  color: #d9cfff;
  overflow: visible;
  animation: float 5s ease-in-out infinite;
}

.lite__core {
  transform-box: fill-box;
  transform-origin: center;
  animation: core 3s ease-in-out infinite;
}

@keyframes core {
  50% {
    transform: scale(1.12);
  }
}

.lite__orbit {
  transform-box: fill-box;
  transform-origin: center;
  animation: orbit 9s linear infinite;
}

@keyframes orbit {
  to {
    transform: rotate(360deg);
  }
}

.lite__beacon {
  animation: beacon 1.6s steps(2) infinite;
}

@keyframes beacon {
  50% {
    opacity: 0.2;
  }
}

.lite__ring {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: ring 2.7s var(--ease-out) infinite;
}

@keyframes ring {
  0% {
    opacity: 0.8;
    transform: scale(0.4);
  }
  100% {
    opacity: 0;
    transform: scale(4);
  }
}
</style>
