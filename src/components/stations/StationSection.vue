<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { app } from '@/state/app'
import { useArrival } from '@/composables/useArrival'
import { firstStopOf, stationById, type StationId } from '@/data/stations'

const LiteScene = defineAsyncComponent(() => import('@/components/lite/LiteScene.vue'))

const props = withDefaults(
  defineProps<{
    id: StationId
    /** Which side the content panel docks to in the 3D view (the world frames the station opposite). */
    side?: 'left' | 'right' | 'center'
    /** Stations holding several stops (the Career Line) spread them across their height. */
    stopCount?: number
    /** Render the slot directly in the section (for pinned layouts). */
    bare?: boolean
  }>(),
  { side: 'left', stopCount: 1, bare: false },
)

const station = computed(() => stationById[props.id])
const stop = computed(() => firstStopOf(props.id))
const el = ref<HTMLElement>()
const arrived = useArrival(el)
</script>

<template>
  <section
    :id="station.id"
    ref="el"
    class="station"
    :class="[`station--${side}`, `station--${station.id}`, { 'station--bare': bare, 'is-arrived': arrived }]"
    :data-stop="stop"
    :data-stop-count="stopCount > 1 ? stopCount : undefined"
    :aria-labelledby="`${station.id}-title`"
    :style="{ '--station': station.color }"
  >
    <template v-if="bare">
      <slot :station="station" :lite="app.mode === 'lite'" />
    </template>
    <template v-else>
      <LiteScene v-if="app.mode === 'lite'" :station="station.id" />
      <div class="station__inner">
        <slot :station="station" :lite="app.mode === 'lite'" />
      </div>
    </template>
  </section>
</template>

<style lang="scss">
// Unscoped on purpose: every station's panels share this layout grammar.
.station {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
}

.station:not(.station--bare) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: calc(var(--header-h) + 40px) var(--gutter) 96px;
}

.station__inner {
  width: 100%;
  max-width: 1360px;
  margin-inline: auto;
}

.station__panel {
  @include panel;
  padding: clamp(22px, 2.6vw, 36px);
}

// Arrival: the panel's blocks settle in, one after another, when the train pulls in.
.js-reveal .station .station__panel > * {
  transition:
    opacity 0.7s var(--ease-out),
    transform 0.8s var(--ease-out);
}

.js-reveal .station:not(.is-arrived) .station__panel > * {
  opacity: 0;
  transform: translateY(18px);
}

@for $i from 1 through 6 {
  .js-reveal .station.is-arrived .station__panel > :nth-child(#{$i}) {
    transition-delay: #{($i - 1) * 70}ms;
  }
}

// ---- 3D: panels dock to one side, the world frames the station on the other ----
.mode-3d {
  .station__inner {
    display: flex;
  }

  .station--left .station__inner {
    justify-content: flex-start;
  }

  .station--right .station__inner {
    justify-content: flex-end;
  }

  .station--center .station__inner {
    justify-content: center;
  }

  .station--left .station__panel,
  .station--right .station__panel {
    width: min(630px, 51vw);
  }

  .station--right .station__inner {
    padding-right: 118px; // clear the metro map
  }

  @include down(lg) {
    .station--right .station__inner {
      padding-right: 0;
    }
  }
}

// ---- Lite (2.5D): a single readable column under the station scene ----
.mode-lite {
  .station:not(.station--bare) {
    justify-content: flex-start;
    padding-top: calc(var(--header-h) + 8px);
  }

  .station__inner {
    max-width: 880px;
  }
}
</style>
