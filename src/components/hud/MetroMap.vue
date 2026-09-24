<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { app } from '@/state/app'
import { onJourney } from '@/state/journey'
import { goToStation } from '@/state/navigation'
import { mapStations, stops } from '@/data/stations'

/**
 * The always-available metro map. It's plain links (works with the 3D world off, and
 * without motion), plus a small train that rides the line with the journey.
 */

const NODE_GAP = 46

// Where each stop sits on the drawn line, in node units (Platform 0 sits just above the first node).
const stopPos = stops.map((s) => {
  if (s.station === 'landing') return -0.7
  const node = mapStations.findIndex((m) => m.id === s.station)
  return s.station === 'career' ? node + (s.milestone ?? 0) * 0.16 : node
})

function posAt(j: number): number {
  const a = Math.floor(j)
  const b = Math.min(stopPos.length - 1, a + 1)
  const f = j - a
  return stopPos[a] + (stopPos[b] - stopPos[a]) * f
}

const train = ref<HTMLElement>()
let off: (() => void) | undefined

onMounted(() => {
  off = onJourney((j) => {
    if (train.value) train.value.style.transform = `translate3d(0, ${posAt(j) * NODE_GAP}px, 0)`
  })
})
onBeforeUnmount(() => off?.())
</script>

<template>
  <nav class="map" :class="{ 'is-cinematic': app.cinematic }" aria-label="Metro map">
    <p class="map__title" aria-hidden="true">Parth Metro</p>
    <div class="map__track" :style="{ '--gap': `${NODE_GAP}px` }">
      <span class="map__rail" aria-hidden="true" />
      <span ref="train" class="map__train" aria-hidden="true"><i /></span>
      <ol class="map__stops">
        <li v-for="s in mapStations" :key="s.id" :style="{ '--station': s.color }">
          <a
            class="map__stop"
            :href="`#${s.id}`"
            :aria-current="app.activeStation === s.id ? 'location' : undefined"
            @click.prevent="goToStation(s.id)"
          >
            <span class="map__label">{{ s.nav }}</span>
            <span class="map__node" aria-hidden="true" />
          </a>
        </li>
      </ol>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.map {
  position: fixed;
  top: 50%;
  right: calc(var(--gutter) - 6px);
  z-index: 30;
  display: none;
  transform: translateY(-50%);
  transition: opacity 0.5s var(--ease-out);

  @include up(lg) {
    display: block;
  }

  &.is-cinematic {
    opacity: 0;
    pointer-events: none;
  }
}

.map__title {
  margin-bottom: 18px;
  padding-right: 2px;
  color: var(--text-3);
  text-align: right;
  @include hud-label(0.625rem);
}

.map__track {
  position: relative;
}

.map__rail {
  position: absolute;
  top: 6px;
  right: 9px;
  bottom: 6px;
  width: 2px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--c-central), var(--c-design), var(--c-engineering), var(--c-projects), var(--c-career), var(--c-ai), var(--c-contact));
  opacity: 0.45;
}

.map__train {
  position: absolute;
  top: calc(var(--gap) / 2 - 11px);
  right: 4px;
  z-index: 2;
  width: 12px;
  height: 22px;
  pointer-events: none;
  will-change: transform;

  i {
    position: absolute;
    inset: 0;
    border-radius: 6px 6px 4px 4px;
    background: linear-gradient(180deg, #fff, #cfd6e2);
    box-shadow:
      0 0 0 2px var(--void),
      0 0 14px rgb(255 181 71 / 0.55);
  }

  i::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 2px;
    right: 2px;
    height: 5px;
    border-radius: 3px;
    background: #0d121d;
  }
}

.map__stops {
  position: relative;
}

.map__stop {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  height: var(--gap);
  padding-left: 12px;
  border-radius: 8px;
  color: var(--text-3);
  transition: color 0.25s;

  &:hover {
    color: var(--text);
  }

  &[aria-current] {
    color: var(--text);
  }
}

.map__label {
  @include hud-label(0.6875rem);
  transition: letter-spacing 0.3s var(--ease-out);

  [aria-current] > & {
    color: var(--station);
  }
}

.map__node {
  position: relative;
  width: 20px;
  height: 20px;
  flex: none;

  &::before {
    content: '';
    position: absolute;
    inset: 4px;
    border: 2px solid var(--station);
    border-radius: 50%;
    background: var(--void);
    transition:
      transform 0.3s var(--ease-out),
      background-color 0.3s;
  }

  .map__stop:hover &::before {
    transform: scale(1.2);
  }

  [aria-current] > &::before {
    background: var(--station);
    transform: scale(1.15);
  }
}
</style>
