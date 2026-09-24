import { Vector3 } from 'three'

/**
 * A railway laid like a model train set: straight pieces and constant-radius curves.
 * Platforms land on exact straights, curves stay smooth, and position/tangent lookups
 * are analytic (no spline sampling or arc-length tables).
 *
 * Coordinates: the track lives on the XZ plane; heading 0 points down +X and positive
 * curve angles turn toward +Z.
 */

interface LineSeg {
  kind: 'line'
  d0: number
  length: number
  x: number
  z: number
  dx: number
  dz: number
}

interface ArcSeg {
  kind: 'arc'
  d0: number
  length: number
  cx: number
  cz: number
  r: number
  /** Angle of the start point around the centre. */
  a0: number
  /** +1 turns toward +Z (heading increases), -1 the other way. */
  turn: 1 | -1
}

type Seg = LineSeg | ArcSeg

const DEG = Math.PI / 180

export class TrackPath {
  readonly segs: Seg[] = []
  readonly marks = new Map<string, number>()
  length = 0
  private x: number
  private z: number
  private heading: number
  private elevation: [number, number][] = [[0, 0]]

  constructor(x = 0, z = 0, headingDeg = 0) {
    this.x = x
    this.z = z
    this.heading = headingDeg * DEG
  }

  straight(len: number): this {
    const dx = Math.cos(this.heading)
    const dz = Math.sin(this.heading)
    this.segs.push({ kind: 'line', d0: this.length, length: len, x: this.x, z: this.z, dx, dz })
    this.x += dx * len
    this.z += dz * len
    this.length += len
    return this
  }

  arc(radius: number, degrees: number): this {
    const turn = degrees >= 0 ? 1 : -1
    const sweep = Math.abs(degrees) * DEG
    // Normal pointing toward increasing heading.
    const nx = -Math.sin(this.heading)
    const nz = Math.cos(this.heading)
    const cx = this.x + nx * radius * turn
    const cz = this.z + nz * radius * turn
    const a0 = Math.atan2(this.z - cz, this.x - cx)
    const length = radius * sweep
    this.segs.push({ kind: 'arc', d0: this.length, length, cx, cz, r: radius, a0, turn })
    const a1 = a0 + sweep * turn
    this.x = cx + Math.cos(a1) * radius
    this.z = cz + Math.sin(a1) * radius
    this.heading += sweep * turn
    this.length += length
    return this
  }

  mark(name: string, offset = 0): this {
    this.marks.set(name, this.length + offset)
    return this
  }

  at(name: string): number {
    const d = this.marks.get(name)
    if (d === undefined) throw new Error(`Unknown track mark: ${name}`)
    return d
  }

  /** Smoothstep-eased elevation keyframes: [distance, height]. */
  setElevation(keys: [number, number][]): this {
    this.elevation = keys.slice().sort((a, b) => a[0] - b[0])
    return this
  }

  heightAt(d: number): number {
    const k = this.elevation
    if (d <= k[0][0]) return k[0][1]
    for (let i = 1; i < k.length; i++) {
      if (d <= k[i][0]) {
        const t = (d - k[i - 1][0]) / (k[i][0] - k[i - 1][0])
        const s = t * t * (3 - 2 * t)
        return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * s
      }
    }
    return k[k.length - 1][1]
  }

  private seg(d: number): Seg {
    const s = this.segs
    let lo = 0
    let hi = s.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (s[mid].d0 <= d) lo = mid
      else hi = mid - 1
    }
    return s[lo]
  }

  /** Point on the track centreline (rail-bed height included). */
  point(d: number, out = new Vector3()): Vector3 {
    const dc = Math.min(this.length, Math.max(0, d))
    const s = this.seg(dc)
    const t = dc - s.d0
    if (s.kind === 'line') {
      out.set(s.x + s.dx * t, 0, s.z + s.dz * t)
    } else {
      const a = s.a0 + (t / s.r) * s.turn
      out.set(s.cx + Math.cos(a) * s.r, 0, s.cz + Math.sin(a) * s.r)
    }
    // Extrapolate past the ends so the camera can look beyond the buffers.
    if (d !== dc) {
      const tan = this.tangent(dc)
      out.addScaledVector(tan, d - dc)
    }
    out.y = this.heightAt(d)
    return out
  }

  /** Unit tangent in the direction of travel. */
  tangent(d: number, out = new Vector3()): Vector3 {
    const dc = Math.min(this.length, Math.max(0, d))
    const s = this.seg(dc)
    if (s.kind === 'line') {
      out.set(s.dx, 0, s.dz)
    } else {
      const a = s.a0 + ((dc - s.d0) / s.r) * s.turn
      out.set(-Math.sin(a) * s.turn, 0, Math.cos(a) * s.turn)
    }
    const slope = (this.heightAt(dc + 0.5) - this.heightAt(dc - 0.5)) / 1
    out.y = slope
    return out.normalize()
  }

  /** Signed curvature (1/r) at d — used to bank the train into curves. */
  curvature(d: number): number {
    const s = this.seg(Math.min(this.length, Math.max(0, d)))
    return s.kind === 'arc' ? s.turn / s.r : 0
  }

  /** Right-hand vector (horizontal) for a tangent. */
  static right(tan: Vector3, out = new Vector3()): Vector3 {
    return out.set(-tan.z, 0, tan.x).normalize()
  }
}
