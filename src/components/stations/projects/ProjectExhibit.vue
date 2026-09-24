<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import ProjectMotif from './ProjectMotif.vue'
import { app } from '@/state/app'
import type { Project } from '@/data/portfolio'

const props = defineProps<{ project: Project }>()
const el = ref<HTMLButtonElement>()

// A gentle holographic tilt that follows the pointer.
function onMove(e: PointerEvent) {
  if (app.reducedMotion || !el.value || e.pointerType === 'touch') return
  const r = el.value.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width - 0.5
  const y = (e.clientY - r.top) / r.height - 0.5
  el.value.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`)
  el.value.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`)
  el.value.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`)
}
function onLeave() {
  el.value?.style.removeProperty('--rx')
  el.value?.style.removeProperty('--ry')
  app.hoverProject = null
}
function open() {
  app.projectOpen = props.project.id
}
</script>

<template>
  <button
    ref="el"
    type="button"
    class="exhibit"
    :class="{ 'is-hot': app.hoverProject === project.id }"
    :data-exhibit="project.id"
    @pointermove="onMove"
    @pointerenter="app.hoverProject = project.id"
    @pointerleave="onLeave"
    @focus="app.hoverProject = project.id"
    @blur="app.hoverProject = null"
    @click="open"
  >
    <span class="exhibit__screen">
      <span class="exhibit__projector" aria-hidden="true">
        <ProjectMotif :motif="project.motif" :size="46" />
      </span>
      <span class="exhibit__body">
        <span class="exhibit__meta">Exhibit {{ project.number }} · {{ project.category }}</span>
        <span class="exhibit__name">{{ project.name }}</span>
        <span class="exhibit__desc">{{ project.description }}</span>
        <span class="exhibit__tech">
          <span v-for="t in project.tech.slice(0, 3)" :key="t" class="chip">{{ t }}</span>
          <span v-if="project.tech.length > 3" class="chip">+{{ project.tech.length - 3 }}</span>
        </span>
      </span>
      <span class="exhibit__go" aria-hidden="true"><AppIcon name="arrow-right" :size="18" /></span>
    </span>
  </button>
</template>

<style scoped lang="scss">
.exhibit {
  @include reset-button;
  display: block;
  width: 100%;
  text-align: left;
  perspective: 900px;
}

.exhibit__screen {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  overflow: hidden;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgb(169 147 255 / 0.1), transparent 55%),
    repeating-linear-gradient(0deg, rgb(255 255 255 / 0.018) 0 1px, transparent 1px 3px),
    rgb(9 11 22 / 0.78);
  box-shadow:
    0 0 0 1px rgb(169 147 255 / 0.28) inset,
    0 18px 40px -22px rgb(0 0 0 / 0.9);
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transform-style: preserve-3d;
  transition:
    transform 0.35s var(--ease-out),
    box-shadow 0.3s;

  // The emitter edge along the top.
  &::before {
    content: '';
    position: absolute;
    inset: 0 12% auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--c-projects), transparent);
    opacity: 0.8;
  }

  // Shimmer that tracks the pointer.
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at var(--mx, 50%) 0%, rgb(169 147 255 / 0.22), transparent 55%);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }
}

.exhibit:hover .exhibit__screen,
.exhibit.is-hot .exhibit__screen,
.exhibit:focus-visible .exhibit__screen {
  box-shadow:
    0 0 0 1px rgb(169 147 255 / 0.6) inset,
    0 0 36px -8px rgb(169 147 255 / 0.45),
    0 18px 40px -22px rgb(0 0 0 / 0.9);

  &::after {
    opacity: 1;
  }
}

.exhibit:focus-visible {
  outline: none;

  .exhibit__screen {
    outline: 2px solid var(--signal);
    outline-offset: 3px;
  }
}

.exhibit__projector {
  position: relative;
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 70%, rgb(169 147 255 / 0.3), rgb(169 147 255 / 0.04) 70%);
  box-shadow: 0 0 0 1px rgb(169 147 255 / 0.3) inset;
  color: #d9cfff;
}

.exhibit__body {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.exhibit__meta {
  color: var(--c-projects);
  @include hud-label(0.5625rem);
}

.exhibit__name {
  @include display(800);
  font-size: 1.1rem;
  line-height: 1.1;
}

.exhibit__desc {
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-2);
  font-size: 0.8125rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.exhibit__tech {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;

  .chip {
    min-height: 22px;
    padding: 1px 8px;
    font-size: 0.6875rem;
  }
}

.exhibit__go {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--hair-2) inset;
  color: var(--c-projects);
  transition: transform 0.3s var(--ease-out);

  .exhibit:hover & {
    transform: translateX(3px);
  }
}

@include down(sm) {
  .exhibit__screen {
    grid-template-columns: auto 1fr;
  }

  .exhibit__go {
    display: none;
  }

  .exhibit__projector {
    width: 54px;
    height: 54px;
  }
}
</style>
