import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three'
import { Anchor, platform } from './kit'
import type { StationBuild, StationContext } from './types'
import { stationSignTexture } from '../util/canvas'

const TEAL = '#53e0c2'

/** AI Lab — a geodesic dome around a thinking core that reacts when the visitor asks a question. */
export function buildAiLab(ctx: StationContext): StationBuild & { think(): void; answer(): void } {
  const { kit, path, stopD, trainLength } = ctx
  const group = new Group()
  group.name = 'ai-lab'
  const a = new Anchor(path, stopD - trainLength / 2)

  group.add(platform(kit, a, 0, { side: -1, length: 15, edge: TEAL }))
  const sign = kit.sign(stationSignTexture({ title: 'AI Lab', kicker: 'Platform 06 · AI-assisted workflow', code: 'AI', color: TEAL }), 3.6, 0.7)
  a.place(sign, 3.6, -2.8, 2.6)
  group.add(sign)

  const lab = new Group()
  a.place(lab, -0.5, -11, 0)
  group.add(lab)

  // Geodesic dome: upper-hemisphere edges of an icosphere + a faint glass shell.
  const ico = new IcosahedronGeometry(6.2, 2)
  const edges = new EdgesGeometry(ico, 1)
  const src = edges.getAttribute('position')
  const keep: number[] = []
  for (let i = 0; i < src.count; i += 2) {
    const y1 = src.getY(i)
    const y2 = src.getY(i + 1)
    if (y1 > -0.05 && y2 > -0.05) keep.push(src.getX(i), y1, src.getZ(i), src.getX(i + 1), y2, src.getZ(i + 1))
  }
  const domeGeo = new BufferGeometry()
  domeGeo.setAttribute('position', new Float32BufferAttribute(keep, 3))
  const domeLines = new LineSegments(domeGeo, kit.own(new LineBasicMaterial({ color: new Color(TEAL).multiplyScalar(0.55), transparent: true, opacity: 0.8, toneMapped: false })))
  const shell = new Mesh(new SphereGeometry(6.15, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), kit.glass)
  const base = new Mesh(new TorusGeometry(6.2, 0.08, 8, 96), kit.light(TEAL, 0.9))
  base.rotation.x = Math.PI / 2
  base.position.y = 0.06
  lab.add(domeLines, shell, base)
  ico.dispose()
  edges.dispose()

  // The core.
  const core = new Group()
  core.position.y = 3.3
  const coreMat = kit.own(
    new MeshStandardMaterial({ color: '#0b2723', emissive: new Color(TEAL), emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.4, flatShading: true }),
  )
  const coreGeo = new IcosahedronGeometry(1.05, 1)
  const coreMesh = new Mesh(coreGeo, coreMat)
  const wire = new LineSegments(new EdgesGeometry(coreGeo), kit.own(new LineBasicMaterial({ color: new Color('#c9fff2'), toneMapped: false })))
  wire.scale.setScalar(1.02)
  const halo = kit.glowSprite(TEAL, 6.5, 0.55)
  core.add(coreMesh, wire, halo)

  const rings: Mesh[] = []
  ;[
    [1.9, 0.4, 0],
    [2.35, -0.6, 0.5],
    [2.8, 1.1, -0.4],
  ].forEach(([r, rx, rz]) => {
    const ring = new Mesh(new TorusGeometry(r, 0.018, 6, 128), kit.light(TEAL, 1.1))
    ring.rotation.set(Math.PI / 2 + rx, 0, rz)
    core.add(ring)
    rings.push(ring)
  })

  // Neural nodes around the core, linked back to it.
  const nodes: Vector3[] = []
  let seed = 5
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  for (let i = 0; i < 14; i++) {
    const theta = rand() * Math.PI * 2
    const phi = Math.acos(2 * rand() - 1)
    const r = 3.4 + rand() * 0.8
    nodes.push(new Vector3(Math.sin(phi) * Math.cos(theta) * r, Math.cos(phi) * r * 0.6, Math.sin(phi) * Math.sin(theta) * r))
  }
  const linkPos: number[] = []
  nodes.forEach((n, i) => {
    linkPos.push(0, 0, 0, n.x, n.y, n.z)
    const m = nodes[(i + 3) % nodes.length]
    linkPos.push(n.x, n.y, n.z, m.x, m.y, m.z)
  })
  const linkGeo = new BufferGeometry()
  linkGeo.setAttribute('position', new Float32BufferAttribute(linkPos, 3))
  const linkMat = kit.own(new LineBasicMaterial({ color: new Color(TEAL), transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false, toneMapped: false }))
  const links = new LineSegments(linkGeo, linkMat)
  const nodeGeo = new BufferGeometry()
  nodeGeo.setAttribute('position', new Float32BufferAttribute(nodes.flatMap((n) => [n.x, n.y, n.z]), 3))
  const nodeMat = kit.own(new PointsMaterial({ color: new Color('#c9fff2'), size: 0.16, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }))
  const nodePoints = new Points(nodeGeo, nodeMat)
  core.add(links, nodePoints)
  lab.add(core)

  let energy = 0
  let flash = 0
  let spin = 0

  return {
    group,
    think() {
      energy = 1
    },
    answer() {
      flash = 1
      energy = Math.max(energy, 0.4)
    },
    update({ time, dt, reducedMotion }) {
      energy = Math.max(0, energy - dt * 0.35)
      flash = Math.max(0, flash - dt * 1.6)
      coreMat.emissiveIntensity = 0.5 + energy * 0.9 + flash * 1.2
      halo.material.opacity = 0.45 + energy * 0.35 + flash * 0.3
      linkMat.opacity = 0.18 + energy * 0.45
      const s = 1 + flash * 0.12
      coreMesh.scale.setScalar(s)
      if (reducedMotion) return
      spin += dt * (0.25 + energy * 2.2)
      coreMesh.rotation.set(spin * 0.6, spin, 0)
      wire.rotation.copy(coreMesh.rotation)
      rings.forEach((r, i) => (r.rotation.z += dt * (0.2 + i * 0.12) * (1 + energy * 3)))
      links.rotation.y = spin * 0.15
      nodePoints.rotation.y = spin * 0.15
      core.position.y = 3.3 + Math.sin(time * 0.8) * 0.12
    },
  }
}
