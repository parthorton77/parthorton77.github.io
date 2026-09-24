<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import StationSection from './StationSection.vue'
import StationSign from '@/components/ui/StationSign.vue'
import TrainGlyph from '@/components/ui/TrainGlyph.vue'
import { onJourney } from '@/state/journey'
import { travelToStop } from '@/state/navigation'
import { formatPeriod, roles } from '@/data/portfolio'
import { CAREER_FIRST_STOP } from '@/data/stations'

/** Scroll distance per milestone while the timeline is pinned. */
const STEP_VH = 72
const last = roles.length - 1

const active = ref(0)
const moving = ref(false)
const role = computed(() => roles[active.value])
const train = ref<HTMLElement>()
const progress = ref<HTMLElement>()
let off: (() => void) | undefined
let stillTimer = 0

// Stops sit evenly along the rail, with a final "Now" marker after the last one.
const slots = roles.length + 1
const xFor = (k: number) => ((k + 0.5) / slots) * 100

onMounted(() => {
  let prev = -1
  off = onJourney((j) => {
    const m = Math.min(last, Math.max(0, j - CAREER_FIRST_STOP))
    const x = xFor(m)
    if (train.value) train.value.style.left = `${x}%`
    if (progress.value) progress.value.style.width = `${x}%`
    const k = Math.round(m)
    if (k !== active.value) active.value = k
    if (prev >= 0 && Math.abs(j - prev) > 1e-4) {
      moving.value = true
      window.clearTimeout(stillTimer)
      stillTimer = window.setTimeout(() => (moving.value = false), 180)
    }
    prev = j
  })
})
onBeforeUnmount(() => {
  off?.()
  window.clearTimeout(stillTimer)
})
</script>

<template>
  <StationSection id="career" side="left" :stop-count="roles.length" bare v-slot="{ station }">
    <div class="career" :style="{ height: `calc(100vh + ${last * STEP_VH}vh)` }">
      <div class="career__pin">
        <div class="career__inner">
          <div class="station__panel career__panel">
            <StationSign :station="station" heading-id="career-title">
              {{ roles.length }} stops from the first design desk to today's service. Scroll to ride the line.
            </StationSign>

            <!-- Screen readers get the whole line at once; the animated card below is visual only. -->
            <ol class="sr-only">
              <li v-for="r in roles" :key="r.id">
                {{ formatPeriod(r) }}: {{ r.role }} at {{ r.company }}<template v-if="r.project"> ({{ r.project }})</template>.
                {{ r.highlights.join(' ') }} Technologies: {{ r.tech.join(', ') }}.
              </li>
            </ol>

            <div class="career__stage" aria-hidden="true">
              <Transition name="card" mode="out-in">
                <article :key="role.id" class="card">
                  <p class="card__period">
                    <span>{{ formatPeriod(role) }}</span>
                    <span class="card__stop">Stop {{ active + 1 }} / {{ roles.length }}</span>
                  </p>
                  <h3 class="card__role">{{ role.role }}</h3>
                  <p class="card__company">
                    {{ role.company }}<span v-if="role.project" class="card__project"> · {{ role.project }}</span>
                  </p>
                  <ul class="card__highlights">
                    <li v-for="h in role.highlights" :key="h">{{ h }}</li>
                  </ul>
                  <ul class="card__tech">
                    <li v-for="t in role.tech" :key="t" class="chip">{{ t }}</li>
                  </ul>
                </article>
              </Transition>
            </div>
          </div>
        </div>

        <nav class="timeline ui" aria-label="Career timeline">
          <div class="timeline__rail" aria-hidden="true">
            <i ref="progress" class="timeline__progress" />
          </div>
          <ol class="timeline__stops">
            <li v-for="(r, i) in roles" :key="r.id" :style="{ left: `${xFor(i)}%` }">
              <button
                type="button"
                class="timeline__stop"
                :class="{ 'is-active': i === active, 'is-passed': i < active }"
                :aria-current="i === active ? 'step' : undefined"
                :aria-label="`${r.start}: ${r.role} at ${r.company}`"
                @click="travelToStop(CAREER_FIRST_STOP + i)"
              >
                <span class="timeline__year">{{ r.start }}</span>
                <span class="timeline__node" aria-hidden="true" />
                <span class="timeline__name">{{ r.short }}</span>
              </button>
            </li>
            <li class="timeline__now" :style="{ left: `${xFor(roles.length)}%` }" aria-hidden="true">
              <span class="timeline__year">Now</span>
              <span class="timeline__node timeline__node--end" />
              <span class="timeline__name">In service</span>
            </li>
          </ol>
          <span ref="train" class="timeline__train" aria-hidden="true"><TrainGlyph :cars="2" :spinning="moving" /></span>
        </nav>
      </div>
    </div>
  </StationSection>
</template>

<style scoped lang="scss">
.career__pin {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100svh;
  padding: calc(var(--header-h) + 20px) var(--gutter) 0;
}

.career__inner {
  display: flex;
  flex: 1;
  align-items: center;
  width: 100%;
  max-width: 1360px;
  min-height: 0;
  margin-inline: auto;
}

.career__panel {
  display: grid;
  gap: 18px;
  width: min(560px, 100%);

  .mode-3d & {
    width: min(560px, 46vw);
  }
}

.career__stage {
  min-height: 240px;
}

.card {
  display: grid;
  gap: 10px;
}

.card__period {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--station);
  @include hud-label(0.6875rem);
}

.card__stop {
  margin-left: auto;
  color: var(--text-3);
}

.card__role {
  @include display(800);
  font-size: clamp(1.35rem, 1rem + 1.3vw, 1.9rem);
  line-height: 1.05;
}

.card__company {
  color: var(--text);
  font-size: 0.98rem;
  font-weight: 500;
}

.card__project {
  color: var(--text-2);
}

.card__highlights {
  display: grid;
  gap: 6px;
  margin-top: 4px;

  li {
    position: relative;
    padding-left: 18px;
    color: var(--text-2);
    font-size: 0.9rem;
    line-height: 1.55;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.62em;
      width: 8px;
      height: 2px;
      border-radius: 2px;
      background: var(--station);
    }
  }
}

.card__tech {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.card-enter-active,
.card-leave-active {
  transition:
    opacity 0.28s var(--ease-out),
    transform 0.38s var(--ease-out);
}

.card-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.card-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

// ---- Timeline ----
.timeline {
  position: relative;
  width: 100%;
  max-width: 1360px;
  height: 118px;
  margin: 0 auto;
  padding-bottom: max(12px, env(safe-area-inset-bottom));

  .mode-3d & {
    padding-right: 118px;

    @include down(lg) {
      padding-right: 0;
    }
  }
}

.timeline__rail {
  position: absolute;
  left: 0;
  right: 0;
  top: 58px;
  height: 6px;
  border-radius: 3px;
  background:
    repeating-linear-gradient(90deg, rgb(150 172 210 / 0.22) 0 2px, transparent 2px 10px),
    rgb(150 172 210 / 0.1);

  .mode-3d & {
    right: 118px;

    @include down(lg) {
      right: 0;
    }
  }
}

.timeline__progress {
  position: absolute;
  inset: 2px auto 2px 0;
  width: 0;
  border-radius: 2px;
  background: var(--station);
  box-shadow: 0 0 12px color-mix(in srgb, var(--station) 60%, transparent);
}

.timeline__stops {
  position: absolute;
  inset: 0;

  .mode-3d & {
    right: 118px;

    @include down(lg) {
      right: 0;
    }
  }

  li {
    position: absolute;
    top: 0;
    display: grid;
    justify-items: center;
    transform: translateX(-50%);
  }
}

.timeline__stop {
  @include reset-button;
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 10px;

  &:hover .timeline__name,
  &:hover .timeline__year {
    color: var(--text);
  }
}

.timeline__now {
  gap: 8px;
  padding: 6px 8px;
}

.timeline__year {
  color: var(--text-2);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 500;
  transition: color 0.25s;

  .is-active & {
    color: var(--station);
  }
}

.timeline__node {
  width: 16px;
  height: 16px;
  border: 2.5px solid rgb(150 172 210 / 0.5);
  border-radius: 50%;
  background: var(--void);
  transition:
    border-color 0.25s,
    background-color 0.25s,
    box-shadow 0.25s;

  .is-passed & {
    border-color: var(--station);
  }

  .is-active & {
    border-color: var(--station);
    background: var(--station);
    box-shadow: 0 0 0 5px color-mix(in srgb, var(--station) 25%, transparent);
  }
}

.timeline__node--end {
  border-style: dashed;
}

.timeline__name {
  color: var(--text-3);
  white-space: nowrap;
  @include hud-label(0.5625rem);
  transition: color 0.25s;

  .is-active & {
    color: var(--text);
  }
}

.timeline__train {
  position: absolute;
  top: 38px;
  width: 76px;
  margin-left: -38px;
  pointer-events: none;
  filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.6));
}

// Short viewports (laptops with browser chrome): the pinned view can't grow, so tighten it.
@media (max-height: 780px) {
  .career__pin {
    padding-top: calc(var(--header-h) + 8px);
  }

  .career__panel {
    gap: 12px;
    padding: 18px 22px;

    :deep(.sign__lede) {
      display: none;
    }

    :deep(.sign__name) {
      font-size: clamp(1.6rem, 1rem + 1.6vw, 2.2rem);
    }
  }

  .career__stage {
    min-height: 0;
  }

  .card {
    gap: 7px;
  }

  .card__highlights li {
    font-size: 0.84rem;
    line-height: 1.45;
  }

  .timeline {
    height: 96px;
  }

  .timeline__rail {
    top: 50px;
  }

  .timeline__train {
    top: 30px;
  }
}

@include down(sm) {
  .timeline {
    height: 104px;
  }

  .timeline__name {
    display: none;
  }

  .timeline__rail {
    top: 52px;
  }

  .timeline__train {
    top: 37px;
    width: 58px;
    margin-left: -29px;
  }

  .career__stage {
    min-height: 0;
  }
}
</style>
