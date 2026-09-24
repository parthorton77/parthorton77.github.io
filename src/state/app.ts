import { reactive, watch } from 'vue'
import type { StationId } from '@/data/stations'

export type ExperienceMode = '3d' | 'lite'
type MotionPref = 'on' | 'off' | null

const MODE_KEY = 'parth-metro:mode'
const MOTION_KEY = 'parth-metro:motion'

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage unavailable (private mode) — preference just won't persist */
  }
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const wideQuery = window.matchMedia('(min-width: 900px)')
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

type NavigatorHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
const hints = navigator as NavigatorHints
const constrained = !!hints.connection?.saveData || (hints.deviceMemory !== undefined && hints.deviceMemory <= 2)
const hasWebGL = webglAvailable()

const storedMode = read(MODE_KEY)
const storedMotion = read(MOTION_KEY)

export const app = reactive({
  /** The 3D world needs a wide viewport, WebGL and a device that isn't asking to save resources. */
  canUse3d: wideQuery.matches && hasWebGL && !constrained,
  modePref: (storedMode === '3d' || storedMode === 'lite' ? storedMode : null) as ExperienceMode | null,
  mode: 'lite' as ExperienceMode,

  osReducedMotion: motionQuery.matches,
  motionPref: (storedMotion === 'on' || storedMotion === 'off' ? storedMotion : null) as MotionPref,
  reducedMotion: false,

  worldReady: false,
  worldFailed: false,

  activeStop: 0,
  activeStation: 'landing' as StationId,
  /** Letterbox bars while the boarding cinematic plays. */
  cinematic: false,
  transferTo: null as string | null,
  projectOpen: null as string | null,
  /** Shared hover state so a chip on the page and a tower in the world light up together. */
  hoverTech: null as string | null,
  hoverProject: null as string | null,
  selectedTech: 'Vue.js',
  mapOpen: false,
})

function resolveMode() {
  app.mode = app.canUse3d && !app.worldFailed ? (app.modePref ?? '3d') : 'lite'
}

function resolveMotion() {
  app.reducedMotion = app.motionPref ? app.motionPref === 'off' : app.osReducedMotion
  const root = document.documentElement
  root.classList.toggle('motion-on', app.motionPref === 'on')
  root.classList.toggle('motion-off', app.motionPref === 'off')
}

resolveMode()
resolveMotion()

wideQuery.addEventListener('change', (e) => {
  app.canUse3d = e.matches && hasWebGL && !constrained
  resolveMode()
})
motionQuery.addEventListener('change', (e) => {
  app.osReducedMotion = e.matches
  resolveMotion()
})

watch(
  () => [app.modePref, app.worldFailed] as const,
  () => {
    write(MODE_KEY, app.modePref)
    resolveMode()
  },
)
watch(
  () => app.motionPref,
  (pref) => {
    write(MOTION_KEY, pref)
    resolveMotion()
  },
)

export function setMode(mode: ExperienceMode) {
  app.modePref = mode
}

export function setMotion(on: boolean) {
  // Store only when it differs from the OS so the OS setting keeps working by default.
  app.motionPref = on === !app.osReducedMotion ? null : on ? 'on' : 'off'
}
