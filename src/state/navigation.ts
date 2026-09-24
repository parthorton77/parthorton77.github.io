import { gsap } from 'gsap'
import { app } from './app'
import { journey, jumpJourney, scrollForStop } from './journey'
import { firstStopOf, stationById, stops, type StationId } from '@/data/stations'

/**
 * Every way of moving through the portfolio funnels through here, so the train, the
 * camera and the page scroll can never disagree: we only ever move the *scroll*, and
 * the journey mapping turns scroll into train motion.
 */

const proxy = { y: 0 }
let tween: gsap.core.Tween | null = null
let transferTimers: number[] = []
let boardingCalls: gsap.core.Tween[] = []
let boarding = false

function stopTween() {
  tween?.kill()
  tween = null
  window.removeEventListener('wheel', stopTween)
  window.removeEventListener('touchstart', stopTween)
  window.removeEventListener('keydown', onKeyInterrupt)
}

/** Cancel every trip in flight — glide, express transfer, boarding — so the newest request wins. */
function cancelPending() {
  stopTween()
  transferTimers.forEach(clearTimeout)
  transferTimers = []
  app.transferTo = null
  boardingCalls.forEach((c) => c.kill())
  boardingCalls = []
  boarding = false
  app.cinematic = false
}

function onKeyInterrupt(e: KeyboardEvent) {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) stopTween()
}

interface GlideOptions {
  duration?: number
  ease?: string
  onComplete?: () => void
}

function glideTo(y: number, { duration = 1.6, ease = 'power2.inOut', onComplete }: GlideOptions = {}) {
  stopTween()
  proxy.y = window.scrollY
  tween = gsap.to(proxy, {
    y,
    duration,
    ease,
    onUpdate: () => window.scrollTo(0, proxy.y),
    onComplete: () => {
      stopTween()
      onComplete?.()
    },
  })
  // The visitor can always take the wheel back.
  window.addEventListener('wheel', stopTween, { passive: true })
  window.addEventListener('touchstart', stopTween, { passive: true })
  window.addEventListener('keydown', onKeyInterrupt)
}

/** Keyboard and screen-reader users land on the destination's heading, like an in-page link. */
function focusStop(stop: number) {
  const id = stops[stop]?.station
  document.getElementById(`${id}-title`)?.focus({ preventScroll: true })
}

function jumpTo(y: number, stop: number, focus = true) {
  window.scrollTo(0, y)
  jumpJourney(stop)
  if (focus) focusStop(stop)
}

/** Move to a stop, choosing the right kind of trip for the distance. */
export function travelToStop(stop: number) {
  cancelPending()
  // Leaving for another stop closes any open exhibit dossier.
  app.projectOpen = null
  const y = scrollForStop(stop)
  const hops = Math.abs(stop - journey.current)
  // Milestone-to-milestone trips along the Career Line keep focus on the timeline controls.
  const sameLine = stops[stop]?.station === 'career' && app.activeStation === 'career'

  if (app.reducedMotion) {
    jumpTo(y, stop, !sameLine)
    return
  }
  if (hops <= 1.05 || sameLine) {
    glideTo(y, { duration: sameLine ? 0.9 : 1.5, onComplete: () => !sameLine && focusStop(stop) })
    return
  }
  expressTransfer(stop, y)
}

/** Long jumps fade through a short "express service" card instead of racing past every station. */
function expressTransfer(stop: number, y: number) {
  app.transferTo = stationById[stops[stop].station].name
  transferTimers.push(
    window.setTimeout(() => {
      window.scrollTo(0, y)
      // Start a little short of the platform so the train still glides in.
      jumpJourney(Math.max(0, stop - 0.35))
      focusStop(stop)
      transferTimers.push(window.setTimeout(() => (app.transferTo = null), 260))
    }, 380),
  )
}

export function goToStation(id: StationId) {
  app.mapOpen = false
  travelToStop(firstStopOf(id))
}

export function nextStation() {
  const order: StationId[] = ['landing', 'profile', 'design', 'engineering', 'projects', 'career', 'ai-lab', 'contact']
  const i = order.indexOf(app.activeStation)
  if (i < order.length - 1) goToStation(order[i + 1])
  else goToStation('landing')
}

/** BOARD THE TRAIN — the short cinematic from Platform 0 into Parth Central. */
export function boardTrain(onDepart?: () => void) {
  if (boarding) return
  cancelPending()
  const target = firstStopOf('profile')
  const y = scrollForStop(target)
  if (app.reducedMotion) {
    jumpTo(y, target)
    return
  }
  boarding = true
  app.cinematic = true
  onDepart?.()
  const done = () => {
    boarding = false
    app.cinematic = false
  }
  // A beat for the signal to turn green, then the departure itself.
  boardingCalls.push(
    gsap.delayedCall(0.35, () => {
      glideTo(y, {
        duration: 2.9,
        ease: 'power1.inOut',
        onComplete: () => {
          done()
          focusStop(target)
        },
      })
    }),
    // If the visitor interrupts the glide, drop the letterbox anyway.
    gsap.delayedCall(3.75, done),
  )
}
