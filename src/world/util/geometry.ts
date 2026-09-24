import { BufferGeometry, Color, Float32BufferAttribute, Shape, Vector3 } from 'three'
import { TrackPath } from '../track/TrackPath'

export interface SweepOptions {
  /** Sampling step along the track (smaller = smoother curves). */
  step?: number
  /** Close the profile loop (tubes) or leave it open (ribbons). */
  closed?: boolean
  /** Lateral offset of the whole profile from the centreline. */
  offset?: number
  /** Per-ring vertex colour. */
  color?: (d: number) => Color
  /** Generate UVs: u across the profile, v along the track (in world units / vScale). */
  vScale?: number
}

/**
 * Extrude a 2D cross-section (x = right, y = up) along a stretch of track. The frame
 * uses world-up rather than Frenet frames, so profiles never twist on curves.
 */
export function sweep(
  path: TrackPath,
  d0: number,
  d1: number,
  profile: [number, number][],
  { step = 0.5, closed = false, offset = 0, color, vScale = 1 }: SweepOptions = {},
): BufferGeometry {
  const rings = Math.max(2, Math.ceil((d1 - d0) / step) + 1)
  const n = profile.length
  const pos: number[] = []
  const uv: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const p = new Vector3()
  const t = new Vector3()
  const r = new Vector3()

  // Accumulated profile length for the u coordinate.
  const lens = [0]
  for (let i = 1; i < n; i++) {
    lens.push(lens[i - 1] + Math.hypot(profile[i][0] - profile[i - 1][0], profile[i][1] - profile[i - 1][1]))
  }
  const total = lens[n - 1] || 1

  for (let k = 0; k < rings; k++) {
    const d = d0 + ((d1 - d0) * k) / (rings - 1)
    path.point(d, p)
    path.tangent(d, t)
    TrackPath.right(t, r)
    const c = color?.(d)
    for (let i = 0; i < n; i++) {
      const [px, py] = profile[i]
      pos.push(p.x + r.x * (px + offset), p.y + py, p.z + r.z * (px + offset))
      uv.push(lens[i] / total, (d - d0) / vScale)
      if (c) col.push(c.r, c.g, c.b)
    }
  }

  // Winding: profiles listed clockwise in (right, up) — or left→right for flat ribbons —
  // produce outward/upward facing triangles.
  const segs = closed ? n : n - 1
  for (let k = 0; k < rings - 1; k++) {
    for (let i = 0; i < segs; i++) {
      const a = k * n + i
      const b = k * n + ((i + 1) % n)
      const c = (k + 1) * n + i
      const e = (k + 1) * n + ((i + 1) % n)
      idx.push(a, b, c, b, e, c)
    }
  }

  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  if (color) g.setAttribute('color', new Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export function roundedRect(w: number, h: number, r: number, x = -w / 2, y = -h / 2): Shape {
  const s = new Shape()
  const rr = Math.min(r, w / 2, h / 2)
  s.moveTo(x + rr, y)
  s.lineTo(x + w - rr, y)
  s.quadraticCurveTo(x + w, y, x + w, y + rr)
  s.lineTo(x + w, y + h - rr)
  s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  s.lineTo(x + rr, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - rr)
  s.lineTo(x, y + rr)
  s.quadraticCurveTo(x, y, x + rr, y)
  return s
}

/** Place an object on the track: position at distance d, facing the direction of travel. */
export function trackYaw(path: TrackPath, d: number): number {
  const t = path.tangent(d)
  return Math.atan2(-t.z, t.x)
}
