<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { app } from '@/state/app'
import { goToStation, nextStation } from '@/state/navigation'
import { stations } from '@/data/stations'

const next = computed(() => {
  const i = stations.findIndex((s) => s.id === app.activeStation)
  return stations[i + 1] ?? null
})
// The Career Line has its own timeline controls along the bottom edge.
const hidden = computed(
  () => app.activeStation === 'landing' || app.activeStation === 'career' || app.cinematic || !!app.projectOpen,
)
</script>

<template>
  <!-- inert while hidden, so it's never an invisible tab stop -->
  <div class="cue" :class="{ 'is-hidden': hidden }" :inert="hidden" :aria-hidden="hidden || undefined">
    <button v-if="next" class="cue__btn" type="button" :style="{ '--station': next.color }" @click="nextStation">
      <span class="cue__label">Next station</span>
      <span class="cue__name">{{ next.name }}</span>
      <AppIcon name="arrow-down" :size="16" />
    </button>
    <button v-else class="cue__btn" type="button" @click="goToStation('landing')">
      <span class="cue__label">Return journey</span>
      <span class="cue__name">Platform 0</span>
      <AppIcon name="arrow-up" :size="16" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.cue {
  position: fixed;
  bottom: max(20px, env(safe-area-inset-bottom));
  left: 50%;
  z-index: 30;
  display: none;
  transform: translateX(-50%);
  transition:
    opacity 0.4s var(--ease-out),
    transform 0.4s var(--ease-out);

  @include up(lg) {
    display: block;
  }

  &.is-hidden {
    visibility: hidden;
    opacity: 0;
    transform: translate(-50%, 12px);
    pointer-events: none;
    // Fade out first, then drop out of the accessibility tree.
    transition:
      opacity 0.4s var(--ease-out),
      transform 0.4s var(--ease-out),
      visibility 0s linear 0.4s;
  }
}

.cue__btn {
  @include reset-button;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  height: 42px;
  padding: 0 18px;
  border: 1px solid var(--hair);
  border-radius: 999px;
  background: rgb(10 14 23 / 0.78);
  backdrop-filter: blur(12px);
  transition: border-color 0.2s;

  &:hover {
    border-color: color-mix(in srgb, var(--station, var(--signal)) 60%, transparent);
  }

  .icon {
    color: var(--station, var(--signal));
  }
}

.cue__label {
  color: var(--text-3);
  @include hud-label(0.625rem);
}

.cue__name {
  @include display(700);
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
}
</style>
