import { TrackPath } from './TrackPath'
import { roles } from '@/data/portfolio'
import { stops } from '@/data/stations'

/** Train geometry the route needs to know about (keep in sync with Train.ts). */
export const TRAIN = {
  carLengths: [3.05, 2.7, 3.05],
  gap: 0.28,
  get length() {
    return this.carLengths.reduce((a, b) => a + b, 0) + this.gap * (this.carLengths.length - 1)
  },
}

export const PLATFORM_LENGTH = 15

/**
 * Line P. Each station is a straight long enough for its platform; curves, a tunnel and
 * the long Career Line straight link them. Marks name the distance where the train's
 * nose comes to rest.
 */
export function buildRoute() {
  const p = new TrackPath(0, 0, 0)

  p.mark('bufferStart').straight(4)
  // Platform 0 — the depot.
  p.straight(20).mark('landing')
  p.straight(24).mark('tunnelIn')
  p.arc(40, 40).straight(12).arc(40, -40)
  p.mark('tunnelOut').straight(22)
  // Parth Central.
  p.straight(24).mark('profile').straight(8)
  p.arc(30, -80).straight(20)
  // Design District.
  p.straight(24).mark('design').straight(8)
  p.arc(34, 100).straight(16)
  // Engineering Station.
  p.straight(24).mark('engineering').straight(8)
  p.arc(30, 70).straight(12)
  // Project Terminal.
  p.straight(24).mark('projects').straight(8)
  p.arc(36, -80).straight(12)
  // Career Line — one long straight, one milestone per role, then the "now" gantry.
  const spacing = 18
  p.mark('careerStart').straight(12)
  roles.forEach((_, i) => {
    p.mark(`career-${i}`)
    p.straight(i === roles.length - 1 ? 14 : spacing)
  })
  p.mark('careerNow').straight(12)
  p.arc(30, 90).straight(14)
  // AI Lab.
  p.straight(24).mark('ai-lab').straight(8)
  p.arc(34, 60).straight(12)
  // Final Station — terminus.
  p.straight(22).mark('contact').straight(3.5).mark('bufferEnd')

  return p
}

/** Track distance of the train's nose for every journey stop. */
export function stopDistances(path: TrackPath): number[] {
  return stops.map((s) => (s.station === 'career' ? path.at(`career-${s.milestone}`) : path.at(s.station)))
}
