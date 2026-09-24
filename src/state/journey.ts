import { app } from './app'
import { stops } from '@/data/stations'

/**
 * The journey value J is a continuous stop index: J = 2 means "docked at stop 2",
 * J = 2.5 means "halfway between stops 2 and 3". Scroll position maps to a *target* J;
 * `current` eases toward it every frame and is what the train, camera and HUD read.
 *
 * Each section marks where its stop is with [data-stop] (and [data-stop-count] when a
 * section — the Career Line — holds several stops). While a section fills the viewport
 * the train dwells; in the scroll distance between sections it travels.
 */

interface Dwell {
  stop: number
  start: number
  end: number
}

type Listener = (j: number) => void

export const journey = {
  target: 0,
  current: 0,
  /** Seconds-based damping rate; higher = snappier. */
  rate: 4.2,
}

const LAST_STOP = stops.length - 1
let dwells: Dwell[] = []
const listeners = new Set<Listener>()
let raf = 0
let lastT = 0

export function onJourney(fn: Listener): () => void {
  listeners.add(fn)
  fn(journey.current)
  return () => listeners.delete(fn)
}

export function measureStops() {
  const vh = window.innerHeight
  const next: Dwell[] = []
  document.querySelectorAll<HTMLElement>('[data-stop]').forEach((el) => {
    const first = Number(el.dataset.stop)
    const count = Number(el.dataset.stopCount ?? 1)
    const top = el.getBoundingClientRect().top + window.scrollY
    const span = Math.max(0, el.offsetHeight - vh)
    if (count <= 1) {
      next.push({ stop: first, start: top, end: top + span })
      return
    }
    const step = span / (count - 1)
    const half = step * 0.16
    for (let k = 0; k < count; k++) {
      const centre = top + step * k
      next.push({
        stop: first + k,
        start: Math.max(top, centre - half),
        end: Math.min(top + span, centre + half),
      })
    }
  })
  dwells = next.sort((a, b) => a.stop - b.stop)
  syncFromScroll()
}

function journeyAt(y: number): number {
  if (!dwells.length) return 0
  if (y <= dwells[0].end) return dwells[0].stop
  for (let i = 1; i < dwells.length; i++) {
    const d = dwells[i]
    if (y < d.start) {
      const prev = dwells[i - 1]
      const f = (y - prev.end) / Math.max(1, d.start - prev.end)
      return prev.stop + Math.min(1, Math.max(0, f)) * (d.stop - prev.stop)
    }
    if (y <= d.end) return d.stop
  }
  return dwells[dwells.length - 1].stop
}

/** Scroll offset at which the train is docked at `stop`. */
export function scrollForStop(stop: number): number {
  const d = dwells.find((x) => x.stop === stop)
  if (!d) return 0
  // Middle of the dwell for pinned milestones, start for ordinary sections.
  const isMilestone = stops[stop]?.milestone !== undefined
  return isMilestone ? (d.start + d.end) / 2 : d.start
}

function setActive(j: number) {
  const stop = Math.min(LAST_STOP, Math.max(0, Math.round(j)))
  if (stop !== app.activeStop) {
    app.activeStop = stop
    app.activeStation = stops[stop].station
  }
}

function syncFromScroll() {
  journey.target = journeyAt(window.scrollY)
  setActive(journey.target)
  wake()
}

function tick(t: number) {
  // Time-based easing (generous cap) so slow devices converge as quickly as fast ones.
  const dt = Math.min(0.3, (t - lastT) / 1000 || 0.016)
  lastT = t
  const diff = journey.target - journey.current
  if (app.reducedMotion || Math.abs(diff) < 0.0005) {
    journey.current = journey.target
  } else {
    journey.current += diff * (1 - Math.exp(-journey.rate * dt))
  }
  listeners.forEach((fn) => fn(journey.current))
  raf = journey.current === journey.target ? 0 : requestAnimationFrame(tick)
}

function wake() {
  if (raf) return
  lastT = performance.now()
  raf = requestAnimationFrame(tick)
}

/** Place the train somewhere without easing (deep links, express transfers). */
export function jumpJourney(j: number) {
  journey.current = j
  wake()
}

let started = false
export function startJourney() {
  if (started) return
  started = true
  window.addEventListener('scroll', syncFromScroll, { passive: true })
  window.addEventListener('resize', measureStops)
  const ro = new ResizeObserver(() => measureStops())
  ro.observe(document.body)
  document.fonts?.ready.then(measureStops).catch(() => {})
  measureStops()
  journey.current = journey.target
}
