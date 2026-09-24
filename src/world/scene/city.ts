import {
  BoxGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  Texture,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { TrackPath } from '../track/TrackPath'
import { makeCanvas, toTexture } from '../util/canvas'

export interface KeepOut {
  /** Segment (capsule) that must stay clear — e.g. a camera's line of sight. */
  a: Vector3
  b: Vector3
  r: number
}

export interface Zone {
  x: number
  z: number
  r: number
}

/**
 * 16×16 grid of window cells (one texture repeat = 8 m, so cells are half a metre —
 * small enough to read as a miniature city rather than a wall of lit squares).
 */
function windowTextures(seed: number): { map: Texture; emissive: Texture } {
  const size = 512
  const cells = 16
  const cell = size / cells
  const [c, ctx] = makeCanvas(size, size)
  const [e, ectx] = makeCanvas(size, size)
  let s = seed
  const rand = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  ctx.fillStyle = '#2a3446'
  ctx.fillRect(0, 0, size, size)
  ectx.fillStyle = '#000'
  ectx.fillRect(0, 0, size, size)
  for (let y = 0; y < cells; y++) {
    // Slab edge between floors.
    ctx.fillStyle = '#323d51'
    ctx.fillRect(0, y * cell, size, 2)
    // Whole floors tend to be lit together, like offices after hours.
    const floorLit = rand() < 0.2
    for (let x = 0; x < cells; x++) {
      const wx = x * cell + cell * 0.18
      const wy = y * cell + cell * 0.3
      const ww = cell * 0.64
      const wh = cell * 0.44
      ctx.fillStyle = '#141b27'
      ctx.fillRect(wx, wy, ww, wh)
      const lit = floorLit ? rand() < 0.55 : rand() < 0.09
      if (lit) {
        const warm = rand() < 0.72
        const a = 0.28 + rand() * 0.5
        ectx.fillStyle = warm ? `rgba(255, 196, 128, ${a})` : `rgba(170, 205, 255, ${a})`
        ectx.fillRect(wx, wy, ww, wh)
      }
    }
  }
  // Keep the (0,0) corner dark: roofs sample it.
  ctx.fillStyle = '#10151f'
  ctx.fillRect(0, 0, 3, 3)
  ectx.fillStyle = '#000'
  ectx.fillRect(0, 0, 3, 3)
  const map = toTexture(c, 4)
  const emissive = toTexture(e, 4)
  for (const t of [map, emissive]) t.wrapS = t.wrapT = RepeatWrapping
  return { map, emissive }
}

/** Box with UVs scaled so one texture cell = one metre, offset per building for variety. */
function buildingBox(w: number, h: number, d: number, uOff: number, vOff: number): BufferGeometry {
  const g = new BoxGeometry(w, h, d)
  const uv = g.getAttribute('uv')
  // Face order: +x, -x, +y, -y, +z, -z (4 verts each).
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v
      const u0 = uv.getX(i)
      const v0 = uv.getY(i)
      if (f === 2 || f === 3) {
        uv.setXY(i, 0.001, 0.001)
      } else {
        const span = f < 2 ? d : w
        uv.setXY(i, (u0 * span) / 8 + uOff, (v0 * h) / 8 + vOff)
      }
    }
  }
  g.translate(0, h / 2, 0)
  return g
}

function distToSegmentSq(p: Vector3, a: Vector3, b: Vector3): number {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const abz = b.z - a.z
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / (abx * abx + aby * aby + abz * abz || 1)))
  const x = a.x + abx * t - p.x
  const y = a.y + aby * t - p.y
  const z = a.z + abz * t - p.z
  return x * x + y * y + z * z
}

export function buildCity(path: TrackPath, zones: Zone[], keepOut: KeepOut[], tints: { x: number; z: number; color: Color }[]) {
  const group = new Group()
  group.name = 'city'

  // Sample the line once for fast "distance to track" queries via a coarse grid.
  const samples: Vector3[] = []
  for (let d = 0; d <= path.length; d += 2) samples.push(path.point(d))
  const cellSize = 12
  const grid = new Map<string, Vector3[]>()
  const key = (x: number, z: number) => `${Math.floor(x / cellSize)},${Math.floor(z / cellSize)}`
  for (const s of samples) {
    const k = key(s.x, s.z)
    if (!grid.has(k)) grid.set(k, [])
    grid.get(k)!.push(s)
  }
  const trackDist = (x: number, z: number) => {
    const cx = Math.floor(x / cellSize)
    const cz = Math.floor(z / cellSize)
    let best = Infinity
    for (let i = -4; i <= 4; i++) {
      for (let j = -4; j <= 4; j++) {
        const list = grid.get(`${cx + i},${cz + j}`)
        if (!list) continue
        for (const s of list) best = Math.min(best, (s.x - x) ** 2 + (s.z - z) ** 2)
      }
    }
    return Math.sqrt(best)
  }

  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const s of samples) {
    minX = Math.min(minX, s.x)
    maxX = Math.max(maxX, s.x)
    minZ = Math.min(minZ, s.z)
    maxZ = Math.max(maxZ, s.z)
  }
  const pad = 70

  let seed = 42
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  const warmGeos: BufferGeometry[] = []
  const coolGeos: BufferGeometry[] = []
  const roofUnits: { x: number; y: number; z: number; s: number }[] = []
  const beacons: Vector3[] = []
  const probe = new Vector3()
  const spacing = 6.2

  for (let x = minX - pad; x < maxX + pad; x += spacing) {
    for (let z = minZ - pad; z < maxZ + pad; z += spacing) {
      const px = x + (rand() - 0.5) * 2.6
      const pz = z + (rand() - 0.5) * 2.6
      const dt = trackDist(px, pz)
      if (dt < 6.5 || dt > 78) continue
      if (zones.some((zn) => (zn.x - px) ** 2 + (zn.z - pz) ** 2 < zn.r * zn.r)) continue
      const density = dt < 30 ? 0.66 : dt < 55 ? 0.5 : 0.3
      if (rand() > density) continue

      const w = 2 + rand() * 2.6
      const d = 2 + rand() * 2.6
      // Low near the line so the train stays the hero; a skyline builds further out.
      const tall = dt < 14 ? 1.5 + rand() * 2.5 : dt < 30 ? 2.5 + rand() * 6 : 4 + rand() * 12 * (rand() < 0.2 ? 1.8 : 1)
      const h = Math.max(1.5, Math.round(tall * 2) / 2)
      probe.set(px, h * 0.5, pz)
      if (keepOut.some((k) => distToSegmentSq(probe, k.a, k.b) < (k.r + Math.max(w, d) * 0.5 + h * 0.15) ** 2)) continue

      const geo = buildingBox(w, h, d, Math.floor(rand() * 8) / 8, Math.floor(rand() * 8) / 8)
      geo.rotateY(Math.floor(rand() * 4) * (Math.PI / 2) + (rand() - 0.5) * 0.05)
      geo.translate(px, 0, pz)
      // Tint toward the nearest district colour.
      let tint = new Color('#9aa6b8')
      let bestD = Infinity
      for (const t of tints) {
        const dd = (t.x - px) ** 2 + (t.z - pz) ** 2
        if (dd < bestD) {
          bestD = dd
          tint = t.color
        }
      }
      const base = new Color('#aab3c2').lerp(tint, 0.14)
      const colors = new Float32Array(geo.getAttribute('position').count * 3)
      for (let i = 0; i < colors.length; i += 3) colors.set([base.r, base.g, base.b], i)
      geo.setAttribute('color', new Float32BufferAttribute(colors, 3))
      ;(rand() < 0.62 ? warmGeos : coolGeos).push(geo)

      if (rand() < 0.35) roofUnits.push({ x: px + (rand() - 0.5) * w * 0.4, y: h, z: pz + (rand() - 0.5) * d * 0.4, s: 0.5 + rand() * 0.6 })
      if (h > 13) beacons.push(new Vector3(px, h + 0.3, pz))
    }
  }

  const materials: (MeshStandardMaterial | MeshBasicMaterial)[] = []
  const textures: Texture[] = []
  const addMerged = (geos: BufferGeometry[], seedTex: number) => {
    if (!geos.length) return
    const { map, emissive } = windowTextures(seedTex)
    textures.push(map, emissive)
    const mat = new MeshStandardMaterial({
      map,
      emissiveMap: emissive,
      emissive: new Color('#ffffff'),
      emissiveIntensity: 0.75,
      vertexColors: true,
      roughness: 0.72,
      metalness: 0.2,
    })
    materials.push(mat)
    const merged = mergeGeometries(geos)!
    geos.forEach((g) => g.dispose())
    const mesh = new Mesh(merged, mat)
    mesh.matrixAutoUpdate = false
    group.add(mesh)
  }
  addMerged(warmGeos, 7)
  addMerged(coolGeos, 19)

  // Rooftop plant.
  const unitMat = new MeshStandardMaterial({ color: '#232b39', roughness: 0.7, metalness: 0.4 })
  materials.push(unitMat)
  const units = new InstancedMesh(new BoxGeometry(1, 0.5, 1), unitMat, roofUnits.length)
  const dummy = new Object3D()
  roofUnits.forEach((u, i) => {
    dummy.position.set(u.x, u.y + 0.25, u.z)
    dummy.scale.set(u.s, 1, u.s * 0.8)
    dummy.updateMatrix()
    units.setMatrixAt(i, dummy.matrix)
  })
  group.add(units)

  // Aviation lights on the tallest towers.
  const beaconMat = new MeshBasicMaterial({ color: new Color('#ff4040').multiplyScalar(1.3), toneMapped: false })
  materials.push(beaconMat)
  const lights = new InstancedMesh(new BoxGeometry(0.22, 0.22, 0.22), beaconMat, Math.max(1, beacons.length))
  beacons.forEach((b, i) => {
    dummy.position.copy(b)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    lights.setMatrixAt(i, dummy.matrix)
  })
  lights.count = beacons.length
  group.add(lights)

  return {
    group,
    count: warmGeos.length + coolGeos.length,
    dispose() {
      group.traverse((o) => {
        if (o instanceof Mesh) o.geometry.dispose()
      })
      materials.forEach((m) => m.dispose())
      textures.forEach((t) => t.dispose())
    },
  }
}
