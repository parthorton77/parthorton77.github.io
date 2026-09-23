<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { experiences } from '../../data/experience'
import { projects } from '../../data/projects'
import { runCommand, yearsRunning, skillCount, type Line } from './shell'

const BOOT_CMD = './boot --profile'

const boot = [
  { tag: 'OK', label: 'mounting   /experience', value: `${yearsRunning} years` },
  { tag: 'OK', label: 'loading    /skills', value: `${skillCount} modules` },
  { tag: 'OK', label: 'linking    /projects', value: `${projects.length} targets` },
  { tag: 'OK', label: 'resolving  /design → /code', value: `${experiences.length} hops` },
  { tag: 'DONE', label: 'session ready', value: 'in 0.42s' }
]

const typed = ref('')
const shown = ref(0)
const booted = ref(false)

const history = ref<Line[]>([])
const input = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const logEl = ref<HTMLElement | null>(null)
const recall = ref<string[]>([])
const recallAt = ref(-1)

const timers: number[] = []
const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)) }

const finishBoot = () => {
  typed.value = BOOT_CMD
  shown.value = boot.length
  booted.value = true
}

const submit = async () => {
  const raw = input.value
  if (!raw.trim()) return
  const result = runCommand(raw)
  recall.value.push(raw)
  recallAt.value = -1
  input.value = ''

  if (result === null) {
    history.value = []
    return
  }
  history.value.push({ kind: 'cmd', text: raw }, ...result)

  await nextTick()
  if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
}

const stepRecall = (delta: number) => {
  if (!recall.value.length) return
  const next = recallAt.value === -1 && delta < 0
    ? recall.value.length - 1
    : recallAt.value + delta
  if (next < 0 || next >= recall.value.length) {
    recallAt.value = -1
    input.value = ''
    return
  }
  recallAt.value = next
  input.value = recall.value[next]
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finishBoot()
    return
  }
  // Type the command, then bring the boot lines up one at a time.
  BOOT_CMD.split('').forEach((char, index) => {
    later(() => { typed.value += char }, 340 + index * 45)
  })
  const afterTyping = 340 + BOOT_CMD.length * 45 + 260
  boot.forEach((_, index) => {
    later(() => { shown.value = index + 1 }, afterTyping + index * 220)
  })
  later(() => { booted.value = true }, afterTyping + boot.length * 220 + 160)
})

onUnmounted(() => timers.forEach(clearTimeout))
</script>

<template>
  <section id="home" class="tr-section tr-boot">
    <div class="tr-window">
      <div class="tr-window__bar">
        <span class="tr-window__dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="tr-window__title">parth@portfolio: ~</span>
        <span class="tr-window__meta">bash — 96×32</span>
      </div>

      <div class="tr-window__body">
        <p class="tr-line">
          <span class="tr-prompt">parth@portfolio</span><span class="tr-sep">:</span><span class="tr-path">~</span><span class="tr-sep">$</span>
          <span class="tr-cmd">{{ typed }}</span><i v-if="!booted" class="tr-caret" aria-hidden="true"></i>
        </p>

        <p v-for="(row, index) in boot.slice(0, shown)" :key="row.label" class="tr-boot__row" :style="{ '--i': index }">
          <span class="tr-tag" :class="row.tag === 'DONE' ? 'is-done' : 'is-ok'">[ {{ row.tag }} ]</span>
          <span class="tr-boot__label">{{ row.label }}</span>
          <span class="tr-boot__dots" aria-hidden="true"></span>
          <span class="tr-boot__value">{{ row.value }}</span>
        </p>

        <div v-if="booted" class="tr-reveal">
          <p class="tr-line">
            <span class="tr-prompt">parth@portfolio</span><span class="tr-sep">:</span><span class="tr-path">~</span><span class="tr-sep">$</span>
            <span class="tr-cmd">whoami</span>
          </p>

          <div class="tr-identity">
            <h1>PARTH PATEL</h1>
            <p class="tr-identity__role">Senior UI Developer</p>
            <p class="tr-identity__note">
              From designing visuals to building experiences — {{ yearsRunning }} years spent moving from
              Photoshop comps to production TypeScript.
            </p>
            <ul class="tr-identity__facts">
              <li><b>status</b><span class="tr-live"><i aria-hidden="true"></i>active</span></li>
              <li><b>host</b><span>AV Devs · CrossCountry Mortgage</span></li>
              <li><b>stack</b><span>Vue · TypeScript · SCSS</span></li>
            </ul>
          </div>

          <div ref="logEl" class="tr-log">
            <template v-for="(line, index) in history" :key="index">
              <p v-if="line.kind === 'cmd'" class="tr-line">
                <span class="tr-prompt">parth@portfolio</span><span class="tr-sep">:</span><span class="tr-path">~</span><span class="tr-sep">$</span>
                <span class="tr-cmd">{{ line.text }}</span>
              </p>
              <p v-else class="tr-out" :class="`is-${line.kind}`">{{ line.text }}</p>
            </template>
          </div>

          <form class="tr-input" @submit.prevent="submit">
            <label for="tr-cmd-input">
              <span class="tr-prompt">parth@portfolio</span><span class="tr-sep">:</span><span class="tr-path">~</span><span class="tr-sep">$</span>
            </label>
            <input
              id="tr-cmd-input"
              ref="inputEl"
              v-model="input"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              placeholder="type `help` and press enter"
              aria-label="Terminal command input"
              @keydown.up.prevent="stepRecall(-1)"
              @keydown.down.prevent="stepRecall(1)"
            />
          </form>

          <p class="tr-hint">
            Try <button type="button" @click="input = 'help'; inputEl?.focus()">help</button>,
            <button type="button" @click="input = 'experience'; inputEl?.focus()">experience</button>,
            <button type="button" @click="input = 'resume'; inputEl?.focus()">resume</button>
            — or just scroll.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
