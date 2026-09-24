<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { app } from '@/state/app'
import { journey } from '@/state/journey'
import { worldBus } from '@/state/worldBus'
import type { MetroWorld } from '@/world/MetroWorld'

const canvas = ref<HTMLCanvasElement>()
let world: MetroWorld | null = null
const offs: (() => void)[] = []
// The component can unmount while the world is still downloading or building (switching
// to 2.5D, or the window narrowing mid-load); every await re-checks this.
let unmounted = false

function fail(reason: unknown) {
  console.error('[parth-metro] 3D world unavailable — switching to the 2.5D journey.', reason)
  app.worldFailed = true
}

function onContextLost(e: Event) {
  e.preventDefault()
  fail('WebGL context lost')
}

function teardown() {
  canvas.value?.removeEventListener('webglcontextlost', onContextLost)
  world?.dispose()
  world = null
}

onMounted(async () => {
  const el = canvas.value
  if (!el) return
  el.addEventListener('webglcontextlost', onContextLost)
  try {
    const { MetroWorld } = await import('@/world/MetroWorld')
    if (unmounted) return
    world = new MetroWorld(el, {
      reducedMotion: app.reducedMotion,
      journey: () => journey.current,
      onHover: (t) => {
        app.hoverTech = t?.kind === 'tech' ? t.id : null
        app.hoverProject = t?.kind === 'project' ? t.id : null
      },
      onSelect: (t) => {
        if (t.kind === 'project') app.projectOpen = t.id
        if (t.kind === 'tech') app.selectedTech = t.id
      },
    })
    await world.init()
    if (unmounted) {
      teardown()
      return
    }
    world.start()
    app.worldReady = true
    offs.push(
      worldBus.on('depart', () => world?.depart()),
      worldBus.on('think', () => world?.aiThink()),
      worldBus.on('answer', () => world?.aiAnswer()),
    )
    // Debug handle for development and automated visual checks (?debug).
    if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) {
      ;(window as unknown as { __metro?: unknown }).__metro = { world, journey }
    }
  } catch (err) {
    if (!unmounted) fail(err)
  }
})

watch(
  () => app.reducedMotion,
  (v) => world?.setReducedMotion(v),
)
// Only fly to an exhibit when we're actually at the Project Terminal (a dossier can also be
// opened from the Engineering readout, where a cross-city camera flight would be jarring).
watch(
  () => app.projectOpen,
  (id) => world?.focus('projects', app.activeStation === 'projects' ? id : null),
)
watch(
  () => app.hoverTech,
  (id) => world?.highlight('tech', id),
)
watch(
  () => app.hoverProject,
  (id) => world?.highlight('project', id),
)

onBeforeUnmount(() => {
  unmounted = true
  offs.forEach((off) => off())
  // Remove the context-lost listener *before* disposing, or releasing the context would
  // look like a failure and disable 3D for the session.
  teardown()
  app.worldReady = false
})
</script>

<template>
  <div class="world" :class="{ 'is-ready': app.worldReady }" aria-hidden="true">
    <canvas ref="canvas" class="world__canvas" />
    <div class="world__vignette" />
  </div>
  <Transition name="boot">
    <p v-if="!app.worldReady && !app.worldFailed" class="boot" aria-hidden="true">
      <span class="boot__bar"><i /></span>
      Powering up the line
    </p>
  </Transition>
</template>

<style scoped lang="scss">
.world {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: var(--void);
  opacity: 0;
  transition: opacity 1.4s var(--ease-out);

  &.is-ready {
    opacity: 1;
  }
}

.world__canvas {
  width: 100%;
  height: 100%;
}

.world__vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 120% 90% at 50% 45%, transparent 55%, rgb(2 3 6 / 0.55) 100%);
}

.boot {
  position: fixed;
  right: var(--gutter);
  bottom: 24px;
  z-index: 35;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-3);
  @include hud-label(0.625rem);
}

.boot__bar {
  position: relative;
  width: 48px;
  height: 2px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--hair);

  i {
    position: absolute;
    inset: 0;
    width: 40%;
    background: var(--signal);
    animation: boot-run 1.1s var(--ease-in-out) infinite;
  }
}

@keyframes boot-run {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(250%);
  }
}

.boot-leave-active {
  transition: opacity 0.6s var(--ease-out);
}

.boot-leave-to {
  opacity: 0;
}
</style>

<style>
html.world-hover .station,
html.world-hover .station__inner {
  cursor: pointer;
}
</style>
