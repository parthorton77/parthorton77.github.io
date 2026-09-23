import { experiences } from '../../data/experience'
import type { Experience } from '../../types/experience'

export type LineToken = 'design' | 'craft' | 'build' | 'ship' | 'now'

export interface Stop extends Experience {
  /** Short name that fits on the map diagram. */
  short: string
  /** Which coloured line this era belongs to. */
  line: LineToken
  kind: 'origin' | 'stop' | 'terminus'
}

/** Map labels and line colours, in the same order as the shared experience data. */
const overlay: Array<Pick<Stop, 'short' | 'line'>> = [
  { short: 'CUESERVE', line: 'design' },
  { short: 'WEBMYNE', line: 'craft' },
  { short: 'PXEL PERFECT', line: 'build' },
  { short: 'OPEN EYES', line: 'ship' },
  { short: 'AV DEVS', line: 'now' }
]

export const stops: Stop[] = experiences.map((experience, index) => ({
  ...experience,
  short: overlay[index]?.short ?? experience.company.toUpperCase(),
  line: overlay[index]?.line ?? 'now',
  kind: index === 0 ? 'origin' : index === experiences.length - 1 ? 'terminus' : 'stop'
}))

/** Route drawn by the hero diagram — straights and 45° bends, the way real maps do it. */
export const mapPath = 'M36 46 H128 L188 106 V152 L252 216 H372'

/** `place: 'side'` is for stations sitting on a vertical run, where stacked labels would cover the track. */
export const mapStations: Array<{ x: number; y: number; place: 'stack' | 'side'; stop: Stop }> = [
  { x: 36, y: 46, place: 'stack', stop: stops[0] },
  { x: 104, y: 46, place: 'stack', stop: stops[1] },
  { x: 188, y: 130, place: 'side', stop: stops[2] },
  { x: 288, y: 216, place: 'stack', stop: stops[3] },
  { x: 372, y: 216, place: 'stack', stop: stops[4] }
]

export const lineNameFor = (token: LineToken) => ({
  design: 'DESIGN LINE',
  craft: 'CRAFT LINE',
  build: 'BUILD LINE',
  ship: 'SHIP LINE',
  now: 'EXPRESS'
}[token])
