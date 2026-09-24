import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { TrackPath } from '../track/TrackPath'
import { TRAIN } from '../track/route'
import { stops, type StationId } from '@/data/stations'

/** Camera placement relative to the docked train's centre: [along, side (+right), up]. */
export interface Framing {
  eye: [number, number, number]
  look: [number, number, number]
  fov: number
  /** Horizontal shift of the subject as a fraction of the viewport (+ = right of centre). */
  shift: number
}

type Transit = 'follow' | 'drone' | 'track'

const DESIGN_ASPECT = 1.6

export const FRAMINGS: Record<StationId, Framing> = {
  landing: { eye: [9.5, -11.5, 3.0], look: [-1.2, 0.9, 1.3], fov: 34, shift: 0.24 },
  profile: { eye: [12.5, -7.6, 4.8], look: [-1.5, 0.8, 2.0], fov: 40, shift: 0.2 },
  design: { eye: [-6.5, 10.0, 5.4], look: [1.0, -4.6, 3.8], fov: 46, shift: -0.2 },
  engineering: { eye: [5.0, -13.5, 5.8], look: [0.0, 4.2, 3.2], fov: 42, shift: 0.2 },
  projects: { eye: [2.0, -15.0, 5.6], look: [0.0, 5.2, 2.7], fov: 37, shift: 0.17 },
  career: { eye: [3.5, -14.5, 4.4], look: [2.5, 1.2, 2.3], fov: 38, shift: 0.16 },
  'ai-lab': { eye: [-5.0, 13.5, 5.4], look: [0.0, -4.6, 3.0], fov: 42, shift: -0.2 },
  contact: { eye: [-15.0, -6.5, 6.4], look: [8.0, 1.2, 2.6], fov: 42, shift: 0.18 },
}

const smoother = (f: number) => f * f * f * (f * (f * 6 - 15) + 10)
const smoothstep = (a: number, b: number, x: number) => {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

export interface Shot {
  eye: Vector3
  look: Vector3
  fov: number
  shift: number
}

export class CameraDirector {
  readonly stopD: number[]
  private readonly transit: Transit[]
  private readonly tmp = { p: new Vector3(), t: new Vector3(), r: new Vector3() }
  private readonly shotA: Shot = { eye: new Vector3(), look: new Vector3(), fov: 40, shift: 0 }
  private readonly shotB: Shot = { eye: new Vector3(), look: new Vector3(), fov: 40, shift: 0 }
  private readonly chase: Shot = { eye: new Vector3(), look: new Vector3(), fov: 50, shift: 0 }
  readonly out: Shot = { eye: new Vector3(), look: new Vector3(), fov: 40, shift: 0 }
  /** 0 at a platform, 1 in full chase — lets the world fade station-only effects. */
  transitWeight = 0

  constructor(
    private readonly path: TrackPath,
    stopD: number[],
  ) {
    this.stopD = stopD
    this.transit = stops.map((s, i): Transit => {
      const next = stops[i + 1]
      if (!next) return 'drone'
      if (s.station === 'landing') return 'follow'
      if (s.station === 'career' && next.station === 'career') return 'track'
      return 'drone'
    })
  }

  /** Train nose distance for a (fractional) journey value, eased between stops. */
  trainFront(j: number): number {
    const a = MathUtils.clamp(Math.floor(j), 0, this.stopD.length - 1)
    const b = Math.min(this.stopD.length - 1, a + 1)
    const f = j - a
    const ease = this.transit[a] === 'track' ? smoothstep(0, 1, f) : smoother(f)
    return this.stopD[a] + (this.stopD[b] - this.stopD[a]) * ease
  }

  /** World-space station shot for a stop (used to keep sight lines clear and aim set pieces). */
  stationShotFor(stop: number): Shot {
    return this.stationShot(stop, { eye: new Vector3(), look: new Vector3(), fov: 40, shift: 0 })
  }

  private stationShot(stop: number, out: Shot): Shot {
    const s = stops[stop]
    const f = FRAMINGS[s.station]
    const centre = this.stopD[stop] - TRAIN.length / 2
    const { p, t, r } = this.tmp
    this.path.point(centre, p)
    this.path.tangent(centre, t)
    t.y = 0
    t.normalize()
    TrackPath.right(t, r)
    out.eye.copy(p).addScaledVector(t, f.eye[0]).addScaledVector(r, f.eye[1])
    out.eye.y = p.y + f.eye[2]
    out.look.copy(p).addScaledVector(t, f.look[0]).addScaledVector(r, f.look[1])
    out.look.y = p.y + f.look[2]
    out.fov = f.fov
    out.shift = f.shift
    return out
  }

  private chaseShot(front: number, style: Transit, out: Shot): Shot {
    const { p, t, r } = this.tmp
    const tail = front - TRAIN.length
    if (style === 'follow') {
      // Behind the tail, under the tunnel crown (3.3) — close enough to feel the speed.
      this.path.point(tail - 5, out.eye)
      this.path.tangent(tail - 5, t)
      TrackPath.right(t, r)
      out.eye.addScaledVector(r, 0.3)
      out.eye.y += 2.2
      this.path.point(front + 7, out.look)
      out.look.y += 0.75
      out.fov = 52
    } else {
      // High three-quarter follow, like a drone pacing the train.
      this.path.point(tail - 6.5, p)
      this.path.tangent(tail - 6.5, t)
      TrackPath.right(t, r)
      out.eye.copy(p).addScaledVector(r, -3.2)
      out.eye.y = p.y + 4.6
      this.path.point(front + 6, out.look)
      out.look.y += 0.6
      out.fov = 48
    }
    out.shift = 0
    return out
  }

  /** Compose the shot for journey value j. */
  shotAt(j: number): Shot {
    const last = this.stopD.length - 1
    const a = MathUtils.clamp(Math.floor(j), 0, last)
    const f = MathUtils.clamp(j - a, 0, 1)
    const out = this.out

    if (f < 1e-4 || a === last) {
      this.transitWeight = 0
      const s = this.stationShot(a, this.shotA)
      out.eye.copy(s.eye)
      out.look.copy(s.look)
      out.fov = s.fov
      out.shift = s.shift
      return out
    }

    const style = this.transit[a]
    const A = this.stationShot(a, this.shotA)
    const B = this.stationShot(a + 1, this.shotB)

    if (style === 'track') {
      // Career Line: a continuous tracking shot alongside the train.
      const k = smoothstep(0, 1, f)
      out.eye.lerpVectors(A.eye, B.eye, k)
      out.look.lerpVectors(A.look, B.look, k)
      out.fov = MathUtils.lerp(A.fov, B.fov, k)
      out.shift = MathUtils.lerp(A.shift, B.shift, k)
      this.transitWeight = 0
      return out
    }

    const front = this.trainFront(j)
    const C = this.chaseShot(front, style, this.chase)
    // Watch the train leave, catch up with it, then hand over to the next platform's shot.
    const w = smoothstep(0.0, 0.34, f) * (1 - smoothstep(0.66, 1.0, f))
    const S = f < 0.5 ? A : B
    out.eye.lerpVectors(S.eye, C.eye, w)
    out.look.lerpVectors(S.look, C.look, w)
    out.fov = MathUtils.lerp(S.fov, C.fov, w)
    out.shift = MathUtils.lerp(S.shift, 0, w)
    this.transitWeight = w
    return out
  }

  static apply(camera: PerspectiveCamera, shot: Shot, width: number, height: number) {
    camera.position.copy(shot.eye)
    camera.lookAt(shot.look)
    // Shots are composed for 16:10. On narrower screens keep the *horizontal* field of
    // view instead, so the station isn't cropped behind the content panel.
    const aspect = width / height
    let fov = shot.fov
    if (aspect < DESIGN_ASPECT) {
      const halfH = Math.atan(Math.tan(MathUtils.degToRad(fov) / 2) * DESIGN_ASPECT)
      fov = MathUtils.radToDeg(2 * Math.atan(Math.tan(halfH) / aspect))
    }
    if (Math.abs(camera.fov - fov) > 1e-3) camera.fov = fov
    camera.setViewOffset(width, height, -shot.shift * width, 0, width, height)
  }
}
