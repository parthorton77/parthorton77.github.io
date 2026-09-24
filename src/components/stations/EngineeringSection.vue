<script setup lang="ts">
import { computed } from 'vue'
import StationSection from './StationSection.vue'
import StationSign from '@/components/ui/StationSign.vue'
import { app } from '@/state/app'
import { currentRole, formatPeriod, newestSkills, projects, roles, skillGroups } from '@/data/portfolio'

const LINE_COLOURS: Record<string, string> = {
  frontend: 'var(--c-engineering)',
  frameworks: 'var(--c-projects)',
  workflow: 'var(--signal)',
}
const lines = skillGroups.filter((g) => g.id !== 'design')

// The résumé lists "HTML"/"CSS" on roles and "HTML5"/"CSS3" as skills — treat them as one.
const ALIASES: Record<string, string[]> = { HTML5: ['HTML5', 'HTML'], CSS3: ['CSS3', 'CSS'] }
const namesFor = (tech: string) => ALIASES[tech] ?? [tech]

const selected = computed(() => {
  const name = app.selectedTech
  const names = namesFor(name)
  return {
    name,
    line: skillGroups.find((g) => g.items.includes(name))?.title ?? '',
    roles: roles.filter((r) => r.tech.some((t) => names.includes(t))).reverse(),
    projects: projects.filter((p) => p.tech.some((t) => names.includes(t))),
    isNew: newestSkills.includes(name),
  }
})

function select(name: string) {
  app.selectedTech = name
  app.hoverTech = name
}
function hover(name: string | null) {
  app.hoverTech = name ?? app.selectedTech
}
</script>

<template>
  <StationSection id="engineering" side="left" v-slot="{ station }">
    <div class="station__panel eng">
      <StationSign :station="station" heading-id="engineering-title">
        The daily service: dynamic, reusable UI components in Vue and TypeScript, styled with SCSS and shipped through
        Git.
      </StationSign>

      <div class="service">
        <p class="service__label"><i aria-hidden="true" />In daily service · {{ currentRole.company }}</p>
        <ul class="service__list">
          <li v-for="t in currentRole.tech" :key="t" class="chip">{{ t }}</li>
        </ul>
      </div>

      <div class="board ui" role="group" aria-label="Platform directory — select a technology">
        <div v-for="g in lines" :key="g.id" class="line" :style="{ '--line': LINE_COLOURS[g.id] }">
          <p class="line__head">
            <span class="line__swatch" aria-hidden="true" />{{ g.title }} line
            <span class="line__count">{{ g.items.length }} stops</span>
          </p>
          <div class="line__stops">
            <button
              v-for="t in g.items"
              :key="t"
              type="button"
              class="stop"
              :class="{ 'is-hot': app.hoverTech === t }"
              :aria-pressed="app.selectedTech === t"
              @click="select(t)"
              @mouseenter="hover(t)"
              @mouseleave="hover(null)"
              @focus="hover(t)"
              @blur="hover(null)"
            >
              {{ t }}<span v-if="newestSkills.includes(t)" class="stop__new">New</span>
            </button>
          </div>
        </div>
      </div>

      <div class="readout" aria-live="polite">
        <p class="readout__head">
          <span class="readout__name">{{ selected.name }}</span>
          <span class="readout__line">{{ selected.line }} line</span>
        </p>
        <template v-if="selected.roles.length || selected.projects.length">
          <p v-if="selected.roles.length" class="readout__row">
            <span class="readout__key">Seen at</span>
            <span>
              <span v-for="r in selected.roles" :key="r.id" class="readout__item">
                {{ r.company }} <small>{{ formatPeriod(r) }}</small>
              </span>
            </span>
          </p>
          <p v-if="selected.projects.length" class="readout__row">
            <span class="readout__key">Exhibits</span>
            <span>
              <button v-for="p in selected.projects" :key="p.id" type="button" class="readout__link" @click="app.projectOpen = p.id">
                {{ p.name }}
              </button>
            </span>
          </p>
        </template>
        <p v-else class="readout__row readout__row--muted">Part of the toolkit listed on the résumé.</p>
        <p v-if="selected.isNew" class="readout__row readout__row--muted">The newest station on the network — see the AI Lab.</p>
      </div>
    </div>
  </StationSection>
</template>

<style scoped lang="scss">
.eng {
  display: grid;
  gap: 20px;
}

.service {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--station) 30%, transparent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--station) 6%, transparent);
}

.service__label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--station);
  @include hud-label(0.625rem);

  i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--go);
    box-shadow: 0 0 8px var(--go);
  }
}

.service__list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.board {
  display: grid;
  gap: 14px;
}

.line__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--text-2);
  @include hud-label(0.625rem);
}

.line__swatch {
  width: 22px;
  height: 4px;
  border-radius: 2px;
  background: var(--line);
}

.line__count {
  margin-left: auto;
  color: var(--text-3);
}

.line__stops {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stop {
  @include reset-button;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--hair);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.025);
  color: var(--text-2);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s,
    transform 0.2s var(--ease-out);

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border: 1.5px solid var(--line);
    border-radius: 50%;
  }

  &:hover,
  &.is-hot {
    border-color: color-mix(in srgb, var(--line) 60%, transparent);
    color: var(--text);
    transform: translateY(-1px);
  }

  &[aria-pressed='true'] {
    border-color: var(--line);
    background: color-mix(in srgb, var(--line) 16%, transparent);
    color: var(--text);

    &::before {
      background: var(--line);
    }
  }
}

.stop__new {
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--signal);
  color: var(--signal-ink);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.readout {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  background: rgb(6 9 15 / 0.6);
  box-shadow: 0 0 0 1px var(--hair) inset;
  font-size: 0.8125rem;
}

.readout__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.readout__name {
  @include display(800);
  font-size: 1.1rem;
}

.readout__line {
  color: var(--text-3);
  @include hud-label(0.625rem);
}

.readout__row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 10px;
  color: var(--text-2);
}

.readout__row--muted {
  display: block;
  color: var(--text-3);
}

.readout__key {
  color: var(--text-3);
  @include hud-label(0.5625rem);
  line-height: 1.9;
}

.readout__item {
  display: inline-block;
  margin: 0 14px 4px 0;
  color: var(--text);

  small {
    margin-left: 4px;
    color: var(--text-3);
    font-family: var(--font-mono);
    font-size: 0.7rem;
  }
}

.readout__link {
  @include reset-button;
  margin: 0 12px 4px 0;
  color: var(--c-projects);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--c-projects) 45%, transparent);
  text-underline-offset: 3px;

  &:hover {
    text-decoration-color: currentColor;
  }
}
</style>
