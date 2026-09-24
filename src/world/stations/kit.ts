import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { TrackPath } from '../track/TrackPath'
import { roundedRect } from '../util/geometry'
import { beamTexture, glowTexture } from '../util/canvas'

/**
 * Bake a set of meshes (children of the same parent) into one geometry so they cost a
 * single draw call. Transforms are applied; the source meshes are not added anywhere.
 */
export function mergeMeshes(meshes: Mesh[], keep: string[] = ['position', 'normal']): BufferGeometry {
  const geos = meshes.map((m) => {
    m.updateMatrix()
    let g = m.geometry.clone().applyMatrix4(m.matrix)
    if (g.index) g = g.toNonIndexed()
    // Keep only the attributes every source shares.
    for (const name of Object.keys(g.attributes)) if (!keep.includes(name)) g.deleteAttribute(name)
    return g
  })
  const merged = mergeGeometries(geos)!
  geos.forEach((g) => g.dispose())
  return merged
}

/** Everything a station builder needs, shared so materials are created once. */
export class Kit {
  readonly concrete = new MeshStandardMaterial({ color: '#141b27', roughness: 0.92, metalness: 0.06 })
  readonly slab = new MeshStandardMaterial({ color: '#1d2533', roughness: 0.72, metalness: 0.12 })
  readonly tactile = new MeshStandardMaterial({ color: '#39414f', roughness: 0.8, metalness: 0.1 })
  readonly metal = new MeshStandardMaterial({ color: '#283243', roughness: 0.42, metalness: 0.72 })
  readonly steel = new MeshStandardMaterial({ color: '#95a1b4', roughness: 0.28, metalness: 0.9 })
  readonly pearl = new MeshStandardMaterial({ color: '#dce3ec', roughness: 0.34, metalness: 0.12 })
  readonly glass = new MeshStandardMaterial({
    color: '#a9c8ff',
    roughness: 0.06,
    metalness: 0.3,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    side: DoubleSide,
  })
  readonly glow: Texture = glowTexture(128)
  readonly beam: Texture = beamTexture()
  private readonly lights = new Map<string, MeshBasicMaterial>()
  private readonly owned: Material[] = []

  /** Unlit "light" material — emissive strips, lamps, signal heads. */
  light(color: string | Color, intensity = 1): MeshBasicMaterial {
    const key = `${new Color(color).getHexString()}:${intensity}`
    let m = this.lights.get(key)
    if (!m) {
      m = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), toneMapped: false })
      this.lights.set(key, m)
    }
    return m
  }

  own<T extends Material>(m: T): T {
    this.owned.push(m)
    return m
  }

  holo(map: Texture | null, color: string | Color, opacity = 0.9): MeshBasicMaterial {
    return this.own(
      new MeshBasicMaterial({
        map,
        color: new Color(color),
        transparent: true,
        opacity,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      }),
    )
  }

  glowSprite(color: string | Color, scale: number, opacity = 0.8): Sprite {
    const s = new Sprite(
      this.own(
        new SpriteMaterial({
          map: this.glow,
          color: new Color(color),
          transparent: true,
          opacity,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      ),
    )
    s.scale.set(scale, scale, 1)
    return s
  }

  /** A two-sided sign (text reads correctly from both faces). */
  sign(map: Texture, w: number, h: number, brightness = 1): Group {
    const g = new Group()
    const mat = this.own(new MeshBasicMaterial({ map, toneMapped: false, color: new Color(brightness, brightness, brightness) }))
    const geo = new PlaneGeometry(w, h)
    const front = new Mesh(geo, mat)
    const back = new Mesh(geo, mat)
    back.rotation.y = Math.PI
    back.position.z = -0.005
    const casing = new Mesh(new BoxGeometry(w + 0.08, h + 0.08, 0.05), this.metal)
    casing.position.z = -0.03
    front.position.z = 0.001
    back.position.z = -0.061
    g.add(casing, front, back)
    return g
  }

  dispose() {
    this.lights.forEach((m) => m.dispose())
    this.owned.forEach((m) => {
      ;(m as MeshBasicMaterial).map?.dispose()
      m.dispose()
    })
    for (const m of [this.concrete, this.slab, this.tactile, this.metal, this.steel, this.pearl, this.glass]) m.dispose()
    this.glow.dispose()
    this.beam.dispose()
  }
}

/** A local frame at a point on the track, for laying out a station around its platform. */
export class Anchor {
  readonly p = new Vector3()
  readonly t = new Vector3()
  readonly r = new Vector3()
  readonly yaw: number

  constructor(
    readonly path: TrackPath,
    readonly d: number,
  ) {
    path.point(d, this.p)
    path.tangent(d, this.t)
    this.t.y = 0
    this.t.normalize()
    TrackPath.right(this.t, this.r)
    this.yaw = Math.atan2(-this.t.z, this.t.x)
  }

  at(along: number, side: number, up: number, out = new Vector3()): Vector3 {
    return out.copy(this.p).addScaledVector(this.t, along).addScaledVector(this.r, side).setY(this.p.y + up)
  }

  /** Position + orient an object in this frame (local +X = direction of travel, +Z = right). */
  place<T extends Object3D>(obj: T, along: number, side: number, up: number, yaw = 0): T {
    this.at(along, side, up, obj.position)
    obj.rotation.y = this.yaw + yaw
    return obj
  }
}

export interface PlatformOptions {
  side: 1 | -1
  length: number
  width?: number
  edge?: string
}

export const PLATFORM_H = 0.62
/** Lateral distance from the track centre to the platform's track-side edge. */
export const PLATFORM_GAP = 0.74

export function platform(kit: Kit, a: Anchor, along: number, { side, length, width = 3.2, edge = '#ffb547' }: PlatformOptions): Group {
  const g = new Group()
  const lateral = side * (PLATFORM_GAP + width / 2)
  const slab = new Mesh(new BoxGeometry(length, PLATFORM_H, width), kit.slab)
  a.place(slab, along, lateral, PLATFORM_H / 2)
  const tactile = new Mesh(new BoxGeometry(length, 0.012, 0.34), kit.tactile)
  a.place(tactile, along, side * (PLATFORM_GAP + 0.32), PLATFORM_H + 0.006)
  const strip = new Mesh(new BoxGeometry(length, 0.03, 0.05), kit.light(edge, 0.9))
  a.place(strip, along, side * (PLATFORM_GAP + 0.04), PLATFORM_H + 0.01)
  g.add(slab, tactile, strip)
  return g
}

export interface CanopyOptions {
  side: 1 | -1
  length: number
  width?: number
  height?: number
  color?: string
}

/** Cantilevered canopy: columns on the far edge, a floating roof with a light line. */
export function canopy(kit: Kit, a: Anchor, along: number, { side, length, width = 3.8, height = 3.3, color = '#ffb547' }: CanopyOptions): Group {
  const g = new Group()
  const inner = PLATFORM_GAP + 0.2
  const lateral = side * (inner + width / 2)
  const roofShape = roundedRect(length, width, 0.5)
  const roofGeo = new ExtrudeGeometry(roofShape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 })
  roofGeo.rotateX(Math.PI / 2)
  const roof = new Mesh(roofGeo, kit.pearl)
  a.place(roof, along, lateral, height + 0.14)
  g.add(roof)

  const under = new Mesh(new BoxGeometry(length - 0.6, 0.02, 0.06), kit.light(color, 1.1))
  a.place(under, along, side * (inner + 0.35), height - 0.03)
  const under2 = new Mesh(new BoxGeometry(length - 0.6, 0.02, 0.06), kit.light('#dfe9ff', 0.7))
  a.place(under2, along, side * (inner + width - 0.7), height - 0.03)
  g.add(under, under2)

  const colGeo = new CylinderGeometry(0.07, 0.09, height, 10)
  const n = Math.max(2, Math.round(length / 4.5))
  for (let i = 0; i < n; i++) {
    const x = along - length / 2 + 1 + (i * (length - 2)) / (n - 1)
    const col = new Mesh(colGeo, kit.metal)
    a.place(col, x, side * (inner + width - 0.45), height / 2 + PLATFORM_H / 2)
    g.add(col)
  }
  return g
}

/** Slim lamp post with a warm head. */
export function lampPost(kit: Kit, a: Anchor, along: number, side: number, height = 2.6, color = '#ffe2b8'): Group {
  const g = new Group()
  const pole = new Mesh(new CylinderGeometry(0.035, 0.05, height, 8), kit.metal)
  pole.position.y = height / 2
  const head = new Mesh(new BoxGeometry(0.32, 0.06, 0.12), kit.light(color, 1.3))
  head.position.set(0, height, 0)
  g.add(pole, head)
  a.place(g, along, side, 0)
  return g
}
