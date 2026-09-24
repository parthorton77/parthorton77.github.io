<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { gsap } from 'gsap'
import AppIcon from '@/components/ui/AppIcon.vue'
import ProjectMotif from './projects/ProjectMotif.vue'
import { app } from '@/state/app'
import { travelToStop } from '@/state/navigation'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { projects, roles } from '@/data/portfolio'
import { CAREER_FIRST_STOP } from '@/data/stations'

const panel = ref<HTMLElement>()
const body = ref<HTMLElement>()
const index = computed(() => projects.findIndex((p) => p.id === app.projectOpen))
const project = computed(() => projects[index.value] ?? null)
const isOpen = computed(() => !!project.value)

function close() {
  app.projectOpen = null
}
function step(dir: 1 | -1) {
  const next = (index.value + dir + projects.length) % projects.length
  app.projectOpen = projects[next].id
}
function toCareer() {
  const p = project.value
  const i = roles.findIndex((r) => r.id === p?.roleId)
  close()
  if (i >= 0) travelToStop(CAREER_FIRST_STOP + i)
}

useFocusTrap(panel, () => isOpen.value, close)

// Zoom out of the exhibit that was clicked (FLIP), then settle the content in.
watch(
  () => app.projectOpen,
  async (id, prev) => {
    if (!id || app.reducedMotion) return
    await nextTick()
    const el = panel.value
    if (!el) return
    // Zoom out of the exhibit card only if it's on screen (a dossier can also open from the
    // Engineering readout); otherwise the panel simply fades in.
    const card = !prev ? document.querySelector<HTMLElement>(`[data-exhibit="${id}"]`) : null
    const cardRect = card?.getBoundingClientRect()
    const origin = cardRect && cardRect.bottom > 0 && cardRect.top < window.innerHeight ? card : null
    const to = el.getBoundingClientRect()
    if (origin) {
      const from = origin.getBoundingClientRect()
      gsap.fromTo(
        el,
        {
          x: from.left - to.left,
          y: from.top - to.top,
          scaleX: from.width / to.width,
          scaleY: from.height / to.height,
          transformOrigin: '0 0',
          opacity: 0.4,
        },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 0.6, ease: 'expo.out', clearProps: 'transform,opacity' },
      )
    }
    if (body.value) {
      gsap.fromTo(
        body.value.children,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, delay: origin ? 0.18 : 0, ease: 'power3.out', clearProps: 'all' },
      )
    }
  },
)
</script>

<template>
  <Transition name="dialog">
    <div v-if="project" class="dialog-root" :class="`dialog-root--${app.mode}`" @click.self="close">
      <div
        ref="panel"
        class="dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`exhibit-${project.id}`"
        tabindex="-1"
      >
        <header class="dialog__bar">
          <span class="dialog__code">Exhibit {{ project.number }} / {{ String(projects.length).padStart(2, '0') }}</span>
          <div class="dialog__nav">
            <button type="button" class="icon-btn" aria-label="Previous exhibit" @click="step(-1)">
              <AppIcon name="arrow-left" :size="18" />
            </button>
            <button type="button" class="icon-btn" aria-label="Next exhibit" @click="step(1)">
              <AppIcon name="arrow-right" :size="18" />
            </button>
            <button type="button" class="icon-btn" aria-label="Close exhibit" data-autofocus @click="close">
              <AppIcon name="close" :size="18" />
            </button>
          </div>
        </header>

        <div :key="project.id" ref="body" class="dialog__body">
          <div class="dialog__title-row">
            <span class="dialog__emblem" aria-hidden="true"><ProjectMotif :motif="project.motif" :size="44" /></span>
            <div>
              <p class="dialog__cat">{{ project.category }}</p>
              <h3 :id="`exhibit-${project.id}`" class="dialog__name">{{ project.name }}</h3>
            </div>
          </div>

          <p class="dialog__lead">{{ project.description }}</p>

          <dl class="dialog__meta">
            <div>
              <dt>Role</dt>
              <dd>{{ project.role }}</dd>
            </div>
            <div v-if="project.period">
              <dt>Period</dt>
              <dd>{{ project.period }}</dd>
            </div>
          </dl>

          <section>
            <h4 class="dialog__label">Contributions</h4>
            <ul class="dialog__list">
              <li v-for="c in project.contributions" :key="c">{{ c }}</li>
            </ul>
          </section>

          <section>
            <h4 class="dialog__label">Technologies</h4>
            <ul class="dialog__tech">
              <li v-for="t in project.tech" :key="t" class="chip">{{ t }}</li>
            </ul>
          </section>

          <section v-if="project.screenshots?.length">
            <h4 class="dialog__label">Screens</h4>
            <div class="dialog__shots">
              <img v-for="s in project.screenshots" :key="s.src" :src="s.src" :alt="s.alt" loading="lazy" />
            </div>
          </section>

          <div class="dialog__actions">
            <a v-for="l in project.links ?? []" :key="l.href" class="btn btn--primary" :href="l.href" target="_blank" rel="noopener">
              {{ l.label }} <AppIcon name="external" :size="16" />
            </a>
            <button v-if="project.roleId" type="button" class="btn btn--ghost" @click="toCareer">
              See it on the Career Line <AppIcon name="arrow-right" :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.dialog-root {
  position: fixed;
  inset: 0;
  z-index: 58;
  display: flex;
  align-items: center;
  padding: calc(var(--header-h) + 12px) var(--gutter) 24px;
  background: rgb(3 5 9 / 0.55);
  backdrop-filter: blur(4px);
}

// In 3D the camera flies to the exhibit on the right, so the dossier docks left over a lighter scrim.
.dialog-root--3d {
  justify-content: flex-start;
  background: linear-gradient(90deg, rgb(3 5 9 / 0.78), rgb(3 5 9 / 0.1) 60%);
  backdrop-filter: none;
}

.dialog-root--lite {
  justify-content: center;
}

.dialog {
  @include panel;
  width: min(560px, 100%);
  max-height: 100%;
  overflow-y: auto;
  background:
    linear-gradient(180deg, rgb(169 147 255 / 0.1), transparent 30%),
    var(--panel-strong);
  border-color: rgb(169 147 255 / 0.35);
  outline: none;
  overscroll-behavior: contain;
}

.dialog__bar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 12px 22px;
  border-bottom: 1px solid var(--hair);
  background: rgb(12 17 28 / 0.95);
}

.dialog__code {
  color: var(--c-projects);
  @include hud-label(0.625rem);
}

.dialog__nav {
  display: flex;
  gap: 6px;
}

.icon-btn {
  @include reset-button;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--hair-2) inset;
  color: var(--text-2);
  transition: color 0.2s, box-shadow 0.2s;

  &:hover {
    color: var(--text);
    box-shadow: 0 0 0 1px rgb(238 242 248 / 0.5) inset;
  }
}

.dialog__body {
  display: grid;
  gap: 20px;
  padding: 22px;
}

.dialog__title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dialog__emblem {
  display: grid;
  flex: none;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 70%, rgb(169 147 255 / 0.32), rgb(169 147 255 / 0.04) 70%);
  box-shadow: 0 0 0 1px rgb(169 147 255 / 0.35) inset;
  color: #d9cfff;
}

.dialog__cat {
  margin-bottom: 4px;
  color: var(--c-projects);
  @include hud-label(0.625rem);
}

.dialog__name {
  @include display(800);
  font-size: clamp(1.5rem, 1.1rem + 1.4vw, 2.1rem);
  line-height: 1;
}

.dialog__lead {
  color: var(--text);
  font-size: 1.02rem;
  line-height: 1.6;
}

.dialog__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 0;
  border-block: 1px solid var(--hair);

  dt {
    margin-bottom: 4px;
    color: var(--text-3);
    @include hud-label(0.5625rem);
  }

  dd {
    font-size: 0.9rem;
    font-weight: 500;
  }
}

.dialog__label {
  margin-bottom: 10px;
  color: var(--text-3);
  @include hud-label(0.625rem);
}

.dialog__list {
  display: grid;
  gap: 8px;

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
      background: var(--c-projects);
    }
  }
}

.dialog__tech {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dialog__shots {
  display: grid;
  gap: 10px;

  img {
    width: 100%;
    border-radius: 10px;
  }
}

.dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  .btn {
    min-height: 44px;
    font-size: 0.72rem;
  }
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.35s var(--ease-out);
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
