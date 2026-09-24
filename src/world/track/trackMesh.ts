import {
  BoxGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Shape,
  Vector3,
} from 'three'
import { TrackPath } from './TrackPath'
import { sweep, trackYaw } from '../util/geometry'

export const RAIL_TOP = 0.22
export const GAUGE = 0.72

export interface TrackBuild {
  group: Group
}

export function buildTrack(path: TrackPath, districtColor: (d: number) => Color): TrackBuild {
  const group = new Group()
  group.name = 'track'
  const L = path.length

  // Ballast bed — slightly raised trapezoid.
  const bedMat = new MeshStandardMaterial({ color: '#10151f', roughness: 0.95, metalness: 0.05 })
  const bed = new Mesh(
    sweep(path, 0, L, [
      [-1.0, 0.0],
      [-0.82, 0.08],
      [0.82, 0.08],
      [1.0, 0.0],
    ], { step: 0.6 }),
    bedMat,
  )
  bed.receiveShadow = false
  group.add(bed)

  // Sleepers — one instanced draw call for the whole line.
  const spacing = 0.52
  const count = Math.floor(L / spacing)
  const sleeperMat = new MeshStandardMaterial({ color: '#232b39', roughness: 0.75, metalness: 0.2 })
  const sleepers = new InstancedMesh(new BoxGeometry(0.2, 0.06, 1.28), sleeperMat, count)
  const dummy = new Object3D()
  const p = new Vector3()
  for (let i = 0; i < count; i++) {
    const d = i * spacing + spacing / 2
    path.point(d, p)
    dummy.position.set(p.x, p.y + 0.11, p.z)
    dummy.rotation.set(0, trackYaw(path, d), 0)
    dummy.updateMatrix()
    sleepers.setMatrixAt(i, dummy.matrix)
  }
  sleepers.instanceMatrix.needsUpdate = true
  group.add(sleepers)

  // Rails — polished steel that picks up the environment highlights.
  const railMat = new MeshStandardMaterial({ color: '#b9c3d3', roughness: 0.24, metalness: 0.92 })
  const railProfile: [number, number][] = [
    [-0.034, RAIL_TOP],
    [0.034, RAIL_TOP],
    [0.034, 0.14],
    [-0.034, 0.14],
  ]
  for (const side of [-1, 1]) {
    group.add(new Mesh(sweep(path, 0, L, railProfile, { closed: true, step: 0.5, offset: (GAUGE / 2) * side }), railMat))
  }

  // Edge light strips that take on each district's colour.
  const edgeMat = new MeshBasicMaterial({ vertexColors: true, toneMapped: false })
  for (const side of [-1, 1]) {
    group.add(
      new Mesh(
        sweep(path, 0, L, [
          [-0.025, 0.085],
          [0.025, 0.085],
        ], { step: 0.8, offset: 0.9 * side, color: districtColor }),
        edgeMat,
      ),
    )
  }

  // Buffer stops at both ends of the line.
  addBuffer(group, path, path.at('bufferStart'), -1)
  addBuffer(group, path, path.at('bufferEnd'), 1)

  return { group }
}

function addBuffer(group: Group, path: TrackPath, d: number, dir: 1 | -1) {
  const g = new Group()
  const frame = new MeshStandardMaterial({ color: '#2a3342', roughness: 0.6, metalness: 0.5 })
  const face = new MeshStandardMaterial({ color: '#d9dee7', roughness: 0.5, metalness: 0.2 })
  const lamp = new MeshBasicMaterial({ color: '#ff4d4d', toneMapped: false })
  const block = new Mesh(new BoxGeometry(0.5, 0.55, 1.3), frame)
  block.position.set(0, 0.45, 0)
  const beam = new Mesh(new BoxGeometry(0.16, 0.26, 1.1), face)
  beam.position.set(-0.3 * dir, 0.5, 0)
  const light = new Mesh(new BoxGeometry(0.1, 0.12, 0.24), lamp)
  light.position.set(-0.36 * dir, 0.86, 0)
  g.add(block, beam, light)
  const p = path.point(d)
  g.position.copy(p)
  g.rotation.y = trackYaw(path, d)
  group.add(g)
}

// ---------------------------------------------------------------- Tunnel

const WALL_H = 1.7
const INNER_R = 1.6
const SHELL = 0.32

function archPoints(r: number, segments: number, fromLeft: boolean): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const a = fromLeft ? Math.PI - t * Math.PI : t * Math.PI
    pts.push([Math.cos(a) * r, WALL_H + Math.sin(a) * r])
  }
  return pts
}

export function buildTunnel(path: TrackPath, d0: number, d1: number): Group {
  const group = new Group()
  group.name = 'tunnel'
  const outer = INNER_R + SHELL
  // Closed, clockwise solid: up the outer wall, over the top, down, then back over the
  // inner arch (right → left) so the inner surface faces into the tunnel.
  const profile: [number, number][] = [
    [-outer, 0],
    ...archPoints(outer, 18, true),
    [outer, 0],
    [INNER_R, 0],
    ...archPoints(INNER_R, 18, false),
    [-INNER_R, 0],
  ]

  const shellMat = new MeshStandardMaterial({ color: '#0d121b', roughness: 0.85, metalness: 0.25 })
  group.add(new Mesh(sweep(path, d0, d1, profile, { closed: true, step: 0.8 }), shellMat))

  // Ridge light running along the roof of the tube.
  const ridgeMat = new MeshBasicMaterial({ color: new Color('#ffb547').multiplyScalar(0.7), toneMapped: false })
  group.add(
    new Mesh(
      sweep(path, d0 + 0.4, d1 - 0.4, [
        [-0.05, WALL_H + outer + 0.005],
        [0.05, WALL_H + outer + 0.005],
      ], { step: 1 }),
      ridgeMat,
    ),
  )

  // Ceiling light rings every few metres — they streak past the chase camera.
  const ringShape = new Shape()
  const r0 = INNER_R - 0.02
  const r1 = INNER_R - 0.055
  const a0 = Math.PI * 0.22
  const a1 = Math.PI * 0.78
  ringShape.absarc(0, WALL_H, r0, a0, a1, false)
  ringShape.absarc(0, WALL_H, r1, a1, a0, true)
  const ringGeo = new ExtrudeGeometry(ringShape, { depth: 0.07, bevelEnabled: false, curveSegments: 16 })
  ringGeo.translate(0, 0, -0.035)
  ringGeo.rotateY(Math.PI / 2)
  const ringMat = new MeshBasicMaterial({ color: new Color('#cfe4ff').multiplyScalar(0.95), toneMapped: false, side: DoubleSide })
  const spacing = 3.2
  const n = Math.floor((d1 - d0 - 2) / spacing)
  const rings = new InstancedMesh(ringGeo, ringMat, n)
  const dummy = new Object3D()
  const p = new Vector3()
  for (let i = 0; i < n; i++) {
    const d = d0 + 1.5 + i * spacing
    path.point(d, p)
    dummy.position.copy(p)
    dummy.rotation.set(0, trackYaw(path, d), 0)
    dummy.updateMatrix()
    rings.setMatrixAt(i, dummy.matrix)
  }
  group.add(rings)

  // Portals: a heavier frame with an amber reveal at each mouth.
  for (const [d, facing] of [
    [d0, -1],
    [d1, 1],
  ] as const) {
    group.add(buildPortal(path, d, facing))
  }
  return group
}

function buildPortal(path: TrackPath, d: number, facing: 1 | -1): Group {
  const g = new Group()
  const outerR = INNER_R + SHELL + 0.34
  const shape = new Shape()
  shape.moveTo(-outerR, 0)
  shape.lineTo(-outerR, WALL_H)
  shape.absarc(0, WALL_H, outerR, Math.PI, 0, true)
  shape.lineTo(outerR, 0)
  shape.lineTo(INNER_R, 0)
  shape.lineTo(INNER_R, WALL_H)
  shape.absarc(0, WALL_H, INNER_R, 0, Math.PI, false)
  shape.lineTo(-INNER_R, 0)
  shape.lineTo(-outerR, 0)
  const frameGeo = new ExtrudeGeometry(shape, {
    depth: 0.9,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    bevelSegments: 2,
    curveSegments: 24,
  })
  frameGeo.translate(0, 0, -0.45)
  frameGeo.rotateY(Math.PI / 2)
  const frame = new Mesh(frameGeo, new MeshStandardMaterial({ color: '#1a2130', roughness: 0.5, metalness: 0.55 }))
  g.add(frame)

  // Amber reveal just inside the mouth.
  const reveal = new Shape()
  reveal.moveTo(-INNER_R - 0.001, 0)
  reveal.lineTo(-INNER_R - 0.001, WALL_H)
  reveal.absarc(0, WALL_H, INNER_R + 0.001, Math.PI, 0, true)
  reveal.lineTo(INNER_R + 0.001, 0)
  reveal.lineTo(INNER_R - 0.07, 0)
  reveal.lineTo(INNER_R - 0.07, WALL_H)
  reveal.absarc(0, WALL_H, INNER_R - 0.07, 0, Math.PI, false)
  reveal.lineTo(-INNER_R + 0.07, 0)
  const revealGeo = new ExtrudeGeometry(reveal, { depth: 0.08, bevelEnabled: false, curveSegments: 24 })
  revealGeo.rotateY(Math.PI / 2)
  revealGeo.translate(0.46 * facing, 0, 0)
  g.add(new Mesh(revealGeo, new MeshBasicMaterial({ color: '#ffb547', toneMapped: false })))

  g.position.copy(path.point(d))
  g.rotation.y = trackYaw(path, d)
  return g
}
