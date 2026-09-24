<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SplitFlap from '@/components/ui/SplitFlap.vue'
import { app } from '@/state/app'
import { boardTrain } from '@/state/navigation'
import { worldBus } from '@/state/worldBus'
import { contact, person } from '@/data/portfolio'
import { mapStations } from '@/data/stations'

const LiteScene = defineAsyncComponent(() => import('@/components/lite/LiteScene.vue'))

const status = ref('Boarding')
const statusText = computed(() => (app.activeStation === 'landing' ? status.value : 'Departed'))

function board() {
  status.value = 'Departing'
  boardTrain(() => worldBus.emit('depart'))
  window.setTimeout(() => (status.value = 'Boarding'), 4200)
}
</script>

<template>
  <section id="landing" class="landing station station--bare" data-stop="0" aria-labelledby="landing-title">
    <div class="landing__inner">
      <p class="landing__eyebrow">
        <span class="landing__pulse" aria-hidden="true" />
        Parth Metro <span aria-hidden="true">·</span> Line P <span aria-hidden="true">·</span> Platform 0
      </p>

      <h1 id="landing-title" class="landing__name" tabindex="-1">
        <span class="landing__first">{{ person.firstName }}</span>
        <span class="landing__last">{{ person.lastName }}</span>
      </h1>
      <p class="landing__role">{{ person.landingTitle }}</p>
      <p class="landing__tagline">{{ person.tagline }}</p>

      <LiteScene v-if="app.mode === 'lite'" station="landing" hero />

      <div class="landing__actions">
        <button class="btn btn--primary" type="button" @click="board">
          <span>Board the train</span>
          <AppIcon name="arrow-right" :size="18" />
        </button>
        <a class="btn btn--ghost" :href="contact.resume" target="_blank" rel="noopener">
          <AppIcon name="file" :size="18" />
          <span>View resume</span>
        </a>
      </div>

      <dl class="departures" aria-label="Departure board">
        <div class="departures__cell">
          <dt>Service</dt>
          <dd>Line P</dd>
        </div>
        <div class="departures__cell">
          <dt>Destination</dt>
          <dd>Final Station</dd>
        </div>
        <div class="departures__cell">
          <dt>Calling at</dt>
          <dd>{{ mapStations.length }} stations</dd>
        </div>
        <div class="departures__cell departures__cell--status">
          <dt>Status</dt>
          <dd><SplitFlap :text="statusText" :cells="9" tone="signal" /></dd>
        </div>
      </dl>
    </div>

    <p class="landing__hint" aria-hidden="true">
      <span>Scroll to depart</span>
      <i />
    </p>
  </section>
</template>

<style scoped lang="scss">
.landing {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  min-height: 100svh;
  padding: calc(var(--header-h) + 24px) var(--gutter) 88px;
  overflow: hidden;

  // Readability scrim for text sitting directly on the 3D scene.
  .mode-3d &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      radial-gradient(ellipse 60% 80% at 12% 50%, rgb(5 7 12 / 0.82), transparent 70%),
      linear-gradient(90deg, rgb(5 7 12 / 0.7), transparent 55%);
    pointer-events: none;
  }
}

.landing__inner {
  position: relative;
  width: 100%;
  max-width: 1360px;
  margin-inline: auto;
  transition:
    opacity 0.5s var(--ease-out),
    transform 0.6s var(--ease-out);

  // Clear the stage for the departure cinematic.
  .is-cinematic & {
    opacity: 0;
    transform: translateY(-24px);
  }
}

.landing__eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: clamp(18px, 3vh, 30px);
  color: var(--text-2);
  @include hud-label;
}

.landing__pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--go);
  box-shadow: 0 0 0 0 rgb(110 231 160 / 0.6);
  animation: pulse 2.4s var(--ease-out) infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(110 231 160 / 0.55);
  }
  70%,
  100% {
    box-shadow: 0 0 0 10px rgb(110 231 160 / 0);
  }
}

.landing__name {
  display: flex;
  flex-direction: column;
  @include display(800);
  font-size: clamp(3rem, 1rem + 7.4vw, 8.2rem);
  line-height: 0.88;
  letter-spacing: -0.02em;
}

.landing__last {
  color: transparent;
  -webkit-text-stroke: 1.5px rgb(238 242 248 / 0.85);
}

.landing__role {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: clamp(16px, 2.6vh, 26px);
  color: var(--signal);
  @include display(700);
  font-size: clamp(1rem, 0.7rem + 1vw, 1.45rem);
  letter-spacing: 0.22em;

  &::before {
    content: '';
    width: 36px;
    height: 3px;
    border-radius: 3px;
    background: currentColor;
  }
}

.landing__tagline {
  max-width: 30ch;
  margin-top: 14px;
  color: var(--text);
  font-size: clamp(1.1rem, 0.9rem + 0.7vw, 1.5rem);
  font-weight: 400;
  line-height: 1.4;
  text-wrap: balance;
}

.landing__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: clamp(24px, 4vh, 40px);
}

.departures {
  display: inline-grid;
  grid-template-columns: repeat(4, auto);
  margin-top: clamp(28px, 5vh, 52px);
  border: 1px solid var(--hair);
  border-radius: 14px;
  background: rgb(10 14 23 / 0.72);
  backdrop-filter: blur(10px);

  @include down(sm) {
    grid-template-columns: repeat(2, auto);
  }
}

.departures__cell {
  display: grid;
  gap: 6px;
  padding: 12px 18px;

  & + & {
    border-left: 1px solid var(--hair);
  }

  @include down(sm) {
    &:nth-child(3) {
      border-left: 0;
    }

    &:nth-child(n + 3) {
      border-top: 1px solid var(--hair);
    }
  }

  dt {
    color: var(--text-3);
    @include hud-label(0.625rem);
  }

  dd {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}

.departures__cell--status dd {
  font-size: 0.8125rem;
}

.landing__hint {
  position: absolute;
  bottom: 28px;
  left: 50%;
  display: grid;
  justify-items: center;
  gap: 10px;
  color: var(--text-3);
  transform: translateX(-50%);
  @include hud-label(0.625rem);

  i {
    position: relative;
    width: 1px;
    height: 34px;
    overflow: hidden;
    background: var(--hair);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--signal);
      animation: hint-drop 2s var(--ease-in-out) infinite;
    }
  }

  .is-cinematic & {
    opacity: 0;
  }
}

@keyframes hint-drop {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(100%);
  }
}

.mode-lite .landing {
  justify-content: center;
  padding-top: calc(var(--header-h) + 12px);
  padding-bottom: 72px;

  .landing__name {
    font-size: clamp(2.9rem, 1rem + 9vw, 6rem);
  }

  .landing__actions {
    margin-top: 8px;
  }

  .departures {
    margin-top: 22px;
  }

  @include down(sm) {
    .landing__actions .btn {
      flex: 1 1 100%;
    }

    .departures {
      display: grid;
      width: 100%;
    }

    .landing__hint {
      display: none;
    }
  }
}
</style>
