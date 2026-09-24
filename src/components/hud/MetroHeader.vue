<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SplitFlap from '@/components/ui/SplitFlap.vue'
import MetroMark from './MetroMark.vue'
import { app, setMode, setMotion } from '@/state/app'
import { goToStation } from '@/state/navigation'
import { stationById, stations } from '@/data/stations'
import { contact } from '@/data/portfolio'

const current = computed(() => stationById[app.activeStation])
const next = computed(() => {
  const i = stations.findIndex((s) => s.id === app.activeStation)
  return stations[i + 1] ?? null
})

const motionOn = computed(() => !app.reducedMotion)
</script>

<template>
  <header class="top" :class="{ 'is-cinematic': app.cinematic }">
    <a class="brand" href="#landing" aria-label="Parth Metro — back to Platform 0" @click.prevent="goToStation('landing')">
      <MetroMark />
      <span class="brand__word">Parth <b>Metro</b></span>
      <span class="brand__line">Line P</span>
    </a>

    <div class="board" aria-hidden="true">
      <span class="board__label">Now</span>
      <SplitFlap class="board__flap" :text="current.name" :cells="19" />
      <span v-if="next" class="board__next"
        ><span class="board__label">Next</span> <span class="board__next-name">{{ next.name }}</span></span
      >
    </div>

    <div class="tools">
      <a class="tool tool--resume" :href="contact.resume" target="_blank" rel="noopener">
        <AppIcon name="file" :size="17" />
        <span>Resume</span>
      </a>
      <!-- Fixed names; state is carried by aria-pressed (and the icon, visually). -->
      <button
        class="tool tool--toggle"
        type="button"
        aria-label="Motion"
        title="Motion — animations and camera movement"
        :aria-pressed="motionOn"
        @click="setMotion(!motionOn)"
      >
        <AppIcon :name="motionOn ? 'pause' : 'play'" :size="16" />
        <span class="tool__text" aria-hidden="true">Motion</span>
      </button>
      <button
        v-if="app.canUse3d && !app.worldFailed"
        class="tool tool--toggle"
        type="button"
        aria-label="3D world"
        title="3D world — off shows the lightweight 2.5D view"
        :aria-pressed="app.mode === '3d'"
        @click="setMode(app.mode === '3d' ? 'lite' : '3d')"
      >
        <AppIcon :name="app.mode === '3d' ? 'cube' : 'layers'" :size="16" />
        <span class="tool__text" aria-hidden="true">3D</span>
      </button>
      <button class="tool tool--map" type="button" aria-haspopup="dialog" @click="app.mapOpen = true">
        <AppIcon name="map" :size="17" />
        <span>Map</span>
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.top {
  position: fixed;
  inset: 0 0 auto;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 20px;
  height: var(--header-h);
  padding: 0 var(--gutter);
  background: linear-gradient(180deg, rgb(5 7 12 / 0.86), rgb(5 7 12 / 0));
  transition:
    transform 0.6s var(--ease-out),
    opacity 0.6s var(--ease-out);

  &.is-cinematic {
    opacity: 0;
    transform: translateY(-12px);
    pointer-events: none;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: auto;
  border-radius: 12px;
}

.brand__word {
  @include display(700);
  font-size: 0.95rem;
  letter-spacing: 0.04em;

  b {
    color: var(--signal);
    font-weight: 800;
  }
}

.brand__line {
  display: none;
  padding: 4px 8px 3px;
  border: 1px solid var(--hair-2);
  border-radius: 999px;
  color: var(--text-2);
  @include hud-label(0.625rem);

  @include up(sm) {
    display: inline-block;
  }
}

.board {
  display: none;
  align-items: center;
  gap: 10px;
  font-size: 0.8125rem;

  @include up(xl) {
    display: flex;
  }
}

.board__label {
  color: var(--text-3);
  @include hud-label(0.625rem);
}

.board__next {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-left: 8px;
}

.board__next-name {
  color: var(--text-2);
  @include hud-label(0.6875rem);
}

.tools {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.tool {
  @include reset-button;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--hair);
  border-radius: 999px;
  background: rgb(13 18 29 / 0.7);
  color: var(--text-2);
  font-size: 0.8125rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition:
    color 0.2s,
    border-color 0.2s,
    background-color 0.2s;

  &:hover {
    border-color: var(--hair-2);
    color: var(--text);
  }

  &[aria-pressed='true'] {
    color: var(--text);
  }

  &[aria-pressed='true'] .icon {
    color: var(--signal);
  }
}

.tool--toggle .tool__text {
  display: none;

  @include up(md) {
    display: inline;
  }
}

.tool--resume {
  display: none;

  @include up(sm) {
    display: inline-flex;
  }
}

.tool--map {
  @include up(lg) {
    display: none;
  }
}

.tool--toggle {
  @include down(md) {
    padding: 0 11px;
  }
}
</style>
