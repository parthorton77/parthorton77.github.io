<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { app, setMode, setMotion } from '@/state/app'
import { goToStation } from '@/state/navigation'
import { mapStations } from '@/data/stations'
import { contact } from '@/data/portfolio'
import { useFocusTrap } from '@/composables/useFocusTrap'

const panel = ref<HTMLElement>()
useFocusTrap(
  panel,
  () => app.mapOpen,
  () => (app.mapOpen = false),
)
</script>

<template>
  <Transition name="overlay">
    <div v-if="app.mapOpen" class="overlay" @click.self="app.mapOpen = false">
      <div ref="panel" class="sheet" role="dialog" aria-modal="true" aria-labelledby="map-title" tabindex="-1">
        <div class="sheet__head">
          <p id="map-title" class="sheet__title">Parth Metro · Line P</p>
          <button class="sheet__close" type="button" aria-label="Close map" data-autofocus @click="app.mapOpen = false">
            <AppIcon name="close" />
          </button>
        </div>

        <nav aria-label="Metro map">
          <ol class="line">
            <li v-for="s in mapStations" :key="s.id" :style="{ '--station': s.color }">
              <a
                class="stop"
                :href="`#${s.id}`"
                :aria-current="app.activeStation === s.id ? 'location' : undefined"
                @click.prevent="goToStation(s.id)"
              >
                <span class="stop__node" aria-hidden="true" />
                <span class="stop__text">
                  <span class="stop__name">{{ s.name }}</span>
                  <span class="stop__kicker">{{ s.kicker }}</span>
                </span>
                <AppIcon class="stop__arrow" name="arrow-right" :size="18" />
              </a>
            </li>
          </ol>
        </nav>

        <div class="sheet__foot">
          <a class="pill pill--signal" :href="contact.resume" target="_blank" rel="noopener">
            <AppIcon name="file" :size="18" /> View resume
          </a>
          <button class="pill" type="button" :aria-pressed="!app.reducedMotion" @click="setMotion(app.reducedMotion)">
            <AppIcon :name="app.reducedMotion ? 'play' : 'pause'" :size="16" />
            Motion
            <span class="pill__state" aria-hidden="true">{{ app.reducedMotion ? 'Off' : 'On' }}</span>
          </button>
          <button
            v-if="app.canUse3d && !app.worldFailed"
            class="pill"
            type="button"
            :aria-pressed="app.mode === '3d'"
            @click="setMode(app.mode === '3d' ? 'lite' : '3d')"
          >
            <AppIcon :name="app.mode === '3d' ? 'cube' : 'layers'" :size="16" />
            3D world
            <span class="pill__state" aria-hidden="true">{{ app.mode === '3d' ? 'On' : 'Off' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  justify-content: flex-end;
  background: rgb(3 5 9 / 0.6);
  backdrop-filter: blur(6px);
}

.sheet {
  display: flex;
  flex-direction: column;
  width: min(440px, 100%);
  height: 100%;
  padding: 20px var(--gutter) max(24px, env(safe-area-inset-bottom));
  overflow-y: auto;
  background: var(--panel-strong);
  border-left: 1px solid var(--hair);
  outline: none;
}

.sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.sheet__title {
  color: var(--text-2);
  @include hud-label;
}

.sheet__close {
  @include reset-button;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--hair);
  border-radius: 50%;
}

.line {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 28px;
    bottom: 28px;
    left: 21px;
    width: 2px;
    background: linear-gradient(180deg, var(--c-central), var(--c-design), var(--c-engineering), var(--c-projects), var(--c-career), var(--c-ai), var(--c-contact));
    opacity: 0.5;
  }
}

.stop {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 64px;
  padding: 8px 8px 8px 12px;
  border-radius: 14px;

  &:hover,
  &[aria-current] {
    background: rgb(255 255 255 / 0.04);
  }
}

.stop__node {
  width: 20px;
  height: 20px;
  flex: none;
  border: 2.5px solid var(--station);
  border-radius: 50%;
  background: var(--void);

  [aria-current] > & {
    background: var(--station);
    box-shadow: 0 0 0 5px color-mix(in srgb, var(--station) 22%, transparent);
  }
}

.stop__text {
  display: grid;
  gap: 2px;
  flex: 1;
}

.stop__name {
  @include display(700);
  font-size: 1.05rem;
}

.stop__kicker {
  color: var(--text-3);
  @include hud-label(0.625rem);
}

.stop__arrow {
  color: var(--text-3);
}

.sheet__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: auto;
  padding-top: 24px;
}

.pill {
  @include reset-button;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--hair-2);
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.pill--signal {
  border-color: transparent;
  background: var(--signal);
  color: var(--signal-ink);
  font-weight: 600;
}

.pill__state {
  padding: 2px 7px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
  color: var(--text-2);
  @include hud-label(0.5625rem);

  [aria-pressed='true'] > & {
    background: color-mix(in srgb, var(--signal) 22%, transparent);
    color: var(--signal);
  }
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s var(--ease-out);

  .sheet {
    transition: transform 0.4s var(--ease-out);
  }
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;

  .sheet {
    transform: translateX(40px);
  }
}
</style>
