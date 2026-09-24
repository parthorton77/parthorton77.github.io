import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  SphereGeometry,
} from 'three'
import { Anchor, canopy, platform } from './kit'
import type { StationBuild, StationContext } from './types'
import { stationSignTexture } from '../util/canvas'

const PEARL = '#eef2f8'

/** Final Station — the terminus: a grand arch past the buffers and a tower broadcasting outward. */
export function buildFinal(ctx: StationContext & { bufferD: number }): StationBuild {
  const { kit, path, stopD, trainLength, bufferD } = ctx
  const group = new Group()
  group.name = 'final'
  const a = new Anchor(path, stopD - trainLength / 2)

  group.add(platform(kit, a, 0, { side: 1, length: 15, edge: '#ffb547' }))
  group.add(canopy(kit, a, -1, { side: 1, length: 11, height: 3.2, color: PEARL }))

  // Terminus arch just beyond the buffer stops.
  const end = new Anchor(path, bufferD + 2.6)
  const arch = new Group()
  for (const z of [-3.6, 3.6]) {
    const leg = new Mesh(new BoxGeometry(0.5, 6.4, 0.5), kit.pearl)
    leg.position.set(0, 3.2, z)
    arch.add(leg)
  }
  const top = new Mesh(new BoxGeometry(0.6, 0.6, 7.7), kit.pearl)
  top.position.y = 6.4
  const underLight = new Mesh(new BoxGeometry(0.1, 0.04, 6.8), kit.light(PEARL, 1.2))
  underLight.position.set(-0.2, 6.08, 0)
  arch.add(top, underLight)
  const sign = kit.sign(stationSignTexture({ title: 'Final Station', kicker: 'Platform 07 · Contact', code: 'FS', color: PEARL }), 5.4, 1.06)
  sign.position.set(-0.33, 7.35, 0)
  sign.rotation.y = -Math.PI / 2
  arch.add(sign)
  end.place(arch, 0, 0, 0)
  group.add(arch)

  // Lattice comms tower.
  const towerH = 13
  const tower = new Group()
  const legs: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]
  const pts: number[] = []
  const w = (y: number) => 1.3 * (1 - y / towerH) + 0.25
  for (const [x, z] of legs) pts.push(x * w(0), 0, z * w(0), x * w(towerH), towerH, z * w(towerH))
  for (let y = 0; y < towerH; y += 1.3) {
    const y2 = Math.min(towerH, y + 1.3)
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = legs[i]
      const [x2, z2] = legs[(i + 1) % 4]
      pts.push(x1 * w(y2), y2, z1 * w(y2), x2 * w(y2), y2, z2 * w(y2))
      pts.push(x1 * w(y), y, z1 * w(y), x2 * w(y2), y2, z2 * w(y2))
    }
  }
  const latticeGeo = new BufferGeometry()
  latticeGeo.setAttribute('position', new Float32BufferAttribute(pts, 3))
  tower.add(new LineSegments(latticeGeo, kit.own(new LineBasicMaterial({ color: new Color('#8e9bb0'), toneMapped: false }))))
  const dish = new Mesh(new SphereGeometry(1.1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2.6), new MeshBasicMaterial({ color: new Color('#cfd7e4'), side: DoubleSide }))
  kit.own(dish.material as MeshBasicMaterial)
  dish.position.y = towerH + 0.3
  dish.rotation.x = Math.PI
  const mast = new Mesh(new CylinderGeometry(0.03, 0.03, 1.8, 6), kit.metal)
  mast.position.y = towerH + 1
  const beacon = kit.glowSprite('#ff5050', 1.3, 0.9)
  beacon.position.y = towerH + 1.95
  tower.add(dish, mast, beacon)

  // Signal rings rising from the dish.
  const ringMats: MeshBasicMaterial[] = []
  const signalRings: Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const m = kit.own(
      new MeshBasicMaterial({ color: new Color(PEARL), transparent: true, opacity: 0, side: DoubleSide, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
    )
    const ring = new Mesh(new RingGeometry(0.96, 1, 64), m)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = towerH + 0.9
    tower.add(ring)
    ringMats.push(m)
    signalRings.push(ring)
  }
  a.place(tower, 9.5, 8.5, 0)
  group.add(tower)

  return {
    group,
    update({ time, reducedMotion }) {
      beacon.material.opacity = 0.3 + 0.6 * Math.max(0, Math.sin(time * 2.6))
      if (reducedMotion) {
        ringMats.forEach((m) => (m.opacity = 0))
        return
      }
      signalRings.forEach((ring, i) => {
        const t = (time * 0.32 + i / 3) % 1
        ring.scale.setScalar(1 + t * 7)
        ring.position.y = towerH + 0.9 + t * 1.6
        ringMats[i].opacity = (1 - t) * 0.45
      })
    },
  }
}
