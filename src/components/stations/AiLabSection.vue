<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import StationSection from './StationSection.vue'
import StationSign from '@/components/ui/StationSign.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { app } from '@/state/app'
import { worldBus } from '@/state/worldBus'
import { goToStation } from '@/state/navigation'
import { ask, suggestions, type AssistantAnswer } from '@/data/assistant'

interface Turn {
  id: number
  q: string
  a: AssistantAnswer
  shown: string
  done: boolean
}

// The workflow tools on the résumé, in résumé order, each labelled with what the tool is.
const workflow = [
  { tool: 'Claude Code', role: 'AI assistant', isNew: true },
  { tool: 'Git', role: 'Version control' },
  { tool: 'GitHub', role: 'Repositories' },
  { tool: 'JIRA', role: 'Issue tracking' },
  { tool: 'VS Code', role: 'Editor' },
]

const turns = ref<Turn[]>([])
const input = ref('')
const busy = ref(false)
const log = ref<HTMLElement>()
let seq = 0
let timer = 0

function scrollLog() {
  nextTick(() => log.value?.scrollTo({ top: log.value.scrollHeight, behavior: app.reducedMotion ? 'auto' : 'smooth' }))
}

function submit(question: string) {
  const q = question.trim()
  if (!q || busy.value) return
  input.value = ''
  const a = ask(q)
  const turn: Turn = { id: ++seq, q, a, shown: '', done: false }
  turns.value.push(turn)
  if (turns.value.length > 6) turns.value.shift()
  busy.value = true
  worldBus.emit('think')
  scrollLog()

  const finish = () => {
    const t = turns.value.find((x) => x.id === turn.id)
    if (t) {
      t.shown = t.a.text
      t.done = true
    }
    busy.value = false
    worldBus.emit('answer')
    scrollLog()
  }
  if (app.reducedMotion) {
    finish()
    return
  }
  // Stream the answer word by word after a short "retrieval" beat.
  const words = a.text.split(/(\s+)/)
  let i = 0
  window.clearTimeout(timer)
  timer = window.setTimeout(function tick() {
    const t = turns.value.find((x) => x.id === turn.id)
    if (!t) return
    i = Math.min(words.length, i + 3)
    t.shown = words.slice(0, i).join('')
    if (i >= words.length) finish()
    else timer = window.setTimeout(tick, 28)
  }, 420)
}

function act(action: NonNullable<AssistantAnswer['actions']>[number]) {
  if (action.station) goToStation(action.station)
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <StationSection id="ai-lab" side="right" v-slot="{ station }">
    <div class="station__panel lab">
      <StationSign :station="station" heading-id="ai-lab-title">
        AI-assisted development is part of the modern workflow — Claude Code is the newest tool on the line. Below is a
        small lab that answers questions about this portfolio.
      </StationSign>

      <div class="flow" role="group" aria-label="Workflow line">
        <p class="flow__label">Workflow line · tools from the résumé</p>
        <ol class="flow__line">
          <li v-for="w in workflow" :key="w.tool" :class="{ 'is-new': w.isNew }">
            <span class="flow__node" aria-hidden="true" />
            <span class="flow__tool">{{ w.tool }}<span v-if="w.isNew" class="flow__new">New</span></span>
            <span class="flow__role">{{ w.role }}</span>
          </li>
        </ol>
      </div>

      <section class="console ui" aria-labelledby="console-title">
        <header class="console__bar">
          <h3 id="console-title" class="console__title"><span aria-hidden="true" class="console__led" :class="{ 'is-busy': busy }" />Ask Parth's portfolio</h3>
          <span class="console__meta">Local · no API</span>
        </header>

        <div ref="log" class="console__log" role="log" aria-live="polite" aria-relevant="additions">
          <p class="msg msg--sys">
            Ask about technologies, UI work, experience, projects or contact details. Every answer is assembled from this
            portfolio's own content.
          </p>
          <template v-for="t in turns" :key="t.id">
            <p class="msg msg--q"><span class="sr-only">You asked: </span>{{ t.q }}</p>
            <div class="msg msg--a">
              <!-- The streamed text is visual only; screen readers get the whole answer once, when it lands. -->
              <p aria-hidden="true">{{ t.done ? t.a.text : t.shown }}<span v-if="!t.done" class="caret" /></p>
              <p v-if="t.done" class="sr-only">Answer: {{ t.a.text }}</p>
              <p v-if="t.done && t.a.sources.length" class="msg__src">Sources · {{ t.a.sources.join(' · ') }}</p>
              <div v-if="t.done && t.a.actions?.length" class="msg__actions">
                <template v-for="ac in t.a.actions" :key="ac.label">
                  <a v-if="ac.href" class="msg__action" :href="ac.href" :target="ac.href.startsWith('mailto') ? undefined : '_blank'" rel="noopener">
                    {{ ac.label }} <AppIcon name="external" :size="13" />
                  </a>
                  <button v-else type="button" class="msg__action" @click="act(ac)">
                    {{ ac.label }} <AppIcon name="arrow-right" :size="13" />
                  </button>
                </template>
              </div>
            </div>
          </template>
        </div>

        <!-- aria-disabled (not disabled) while answering, so focus never drops to <body>. -->
        <div class="console__suggest" role="group" aria-label="Suggested questions">
          <button v-for="s in suggestions" :key="s" type="button" class="suggest" :aria-disabled="busy" @click="submit(s)">{{ s }}</button>
        </div>

        <form class="console__form" @submit.prevent="submit(input)">
          <label class="sr-only" for="ask-input">Ask a question about Parth's portfolio</label>
          <input
            id="ask-input"
            v-model="input"
            type="text"
            autocomplete="off"
            maxlength="160"
            placeholder="e.g. Does Parth use TypeScript?"
          />
          <button type="submit" class="console__send" :aria-disabled="busy || !input.trim()" aria-label="Ask">
            <AppIcon name="send" :size="18" />
          </button>
        </form>
      </section>
    </div>
  </StationSection>
</template>

<style scoped lang="scss">
.lab {
  display: grid;
  gap: 20px;
}

.flow__label {
  margin-bottom: 12px;
  color: var(--text-3);
  @include hud-label(0.625rem);
}

.flow__line {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: calc(20% - 6px);
    height: 2px;
    background: color-mix(in srgb, var(--station) 55%, transparent);
  }

  li {
    position: relative;
    display: grid;
    gap: 6px;
  }
}

.flow__node {
  width: 14px;
  height: 14px;
  border: 2px solid var(--station);
  border-radius: 50%;
  background: var(--deep);

  .is-new & {
    background: var(--station);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--station) 25%, transparent);
  }
}

.flow__tool {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.flow__new {
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--signal);
  color: var(--signal-ink);
  font-size: 0.5rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.flow__role {
  color: var(--text-3);
  @include hud-label(0.5625rem);
}

.console {
  display: grid;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--station) 30%, transparent);
  border-radius: 16px;
  background: rgb(4 9 10 / 0.7);
}

.console__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 14px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--hair);
}

.console__title {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text);
  @include hud-label(0.6875rem);
}

.console__led {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--station);
  box-shadow: 0 0 10px var(--station);

  &.is-busy {
    animation: led 0.6s ease-in-out infinite alternate;
  }
}

@keyframes led {
  to {
    opacity: 0.25;
  }
}

.console__meta {
  color: var(--text-3);
  @include hud-label(0.5625rem);
}

.console__log {
  display: grid;
  align-content: start;
  gap: 10px;
  height: 212px;
  padding: 14px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.msg {
  max-width: 92%;
  font-size: 0.85rem;
  line-height: 1.55;
}

.msg--sys {
  color: var(--text-3);
}

.msg--q {
  justify-self: end;
  padding: 8px 12px;
  border-radius: 12px 12px 4px 12px;
  background: color-mix(in srgb, var(--station) 16%, transparent);
  color: var(--text);
}

.msg--a {
  display: grid;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 12px 12px 12px 4px;
  background: rgb(255 255 255 / 0.035);
  box-shadow: 0 0 0 1px var(--hair) inset;
  color: var(--text-2);
}

.msg__src {
  color: var(--station);
  @include hud-label(0.5625rem);
}

.msg__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.msg__action {
  @include reset-button;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--station) 40%, transparent);
  border-radius: 999px;
  color: var(--text);
  font-size: 0.75rem;

  &:hover {
    background: color-mix(in srgb, var(--station) 12%, transparent);
  }
}

.caret {
  display: inline-block;
  width: 7px;
  height: 1em;
  margin-left: 2px;
  vertical-align: -2px;
  background: var(--station);
  animation: led 0.5s steps(1) infinite;
}

.console__suggest {
  display: flex;
  gap: 6px;
  padding: 10px 14px;
  overflow-x: auto;
  border-top: 1px solid var(--hair);
  scrollbar-width: none;
}

.suggest {
  @include reset-button;
  flex: none;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--hair-2);
  border-radius: 999px;
  color: var(--text-2);
  font-size: 0.75rem;
  white-space: nowrap;
  transition:
    color 0.2s,
    border-color 0.2s;

  &:hover:not([aria-disabled='true']) {
    border-color: color-mix(in srgb, var(--station) 60%, transparent);
    color: var(--text);
  }

  &[aria-disabled='true'] {
    opacity: 0.5;
    cursor: progress;
  }
}

.console__form {
  display: flex;
  gap: 8px;
  padding: 10px 14px 14px;

  input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--hair-2);
    border-radius: 12px;
    background: rgb(0 0 0 / 0.35);
    color: var(--text);
    font: inherit;
    font-size: 0.875rem;

    &::placeholder {
      color: var(--text-3);
    }

    &:focus-visible {
      border-color: var(--station);
      outline: none;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--station) 25%, transparent);
    }
  }
}

.console__send {
  @include reset-button;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--station);
  color: #03201a;

  &[aria-disabled='true'] {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
