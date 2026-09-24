import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  EdgesGeometry,
  ExtrudeGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Shape,
  TorusGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Anchor, mergeMeshes, platform } from './kit'
import type { Hoverable, StationBuild, StationContext } from './types'
import { labelTexture, stationSignTexture } from '../util/canvas'
import { projects, type Project } from '@/data/portfolio'

const VIOLET = '#a993ff'

/**
 * A hologram miniature: glowing edges over faint additive faces. Pieces are collected
 * and merged so each miniature costs two draw calls (faces + edges), not two per piece.
 */
function miniature(motif: Project['motif'], lineMat: LineBasicMaterial, faceMat: MeshBasicMaterial): Group {
  const g = new Group()
  const faces: Mesh[] = []
  const add = (geo: BufferGeometry, x = 0, y = 0, z = 0) => {
    const m = new Mesh(geo)
    m.position.set(x, y, z)
    faces.push(m)
    return m
  }
  if (motif === 'house') {
    add(new BoxGeometry(1.3, 0.8, 1.0), 0, 0.4, 0)
    const roof = new Shape()
    roof.moveTo(-0.78, 0)
    roof.lineTo(0, 0.62)
    roof.lineTo(0.78, 0)
    roof.lineTo(-0.78, 0)
    const roofGeo = new ExtrudeGeometry(roof, { depth: 1.12, bevelEnabled: false })
    roofGeo.translate(0, 0, -0.56)
    add(roofGeo, 0, 0.8, 0)
    add(new BoxGeometry(0.16, 0.38, 0.16), 0.4, 1.18, 0.2)
    add(new BoxGeometry(0.28, 0.46, 0.02), -0.2, 0.23, 0.51)
    add(new BoxGeometry(0.28, 0.24, 0.02), 0.32, 0.5, 0.51)
  } else if (motif === 'storefront') {
    add(new BoxGeometry(1.5, 1.0, 0.9), 0, 0.5, 0)
    const awning = new BoxGeometry(1.62, 0.06, 0.5)
    const aw = add(awning, 0, 0.98, 0.62)
    aw.rotation.x = 0.35
    add(new BoxGeometry(1.1, 0.26, 0.04), 0, 1.24, 0.46)
    add(new BoxGeometry(0.9, 0.5, 0.02), -0.18, 0.4, 0.46)
    add(new BoxGeometry(0.28, 0.66, 0.02), 0.5, 0.33, 0.46)
  } else {
    // Assessment & surveys: a checklist board beside a small bar chart.
    add(new BoxGeometry(1.0, 1.35, 0.06), -0.35, 0.72, 0)
    add(new BoxGeometry(0.4, 0.12, 0.08), -0.35, 1.42, 0)
    for (let i = 0; i < 3; i++) {
      add(new BoxGeometry(0.14, 0.14, 0.04), -0.66, 1.08 - i * 0.34, 0.05)
      add(new BoxGeometry(0.52, 0.06, 0.03), -0.24, 1.08 - i * 0.34, 0.05)
    }
    ;[0.45, 0.8, 0.62].forEach((h, i) => add(new BoxGeometry(0.18, h, 0.18), 0.4 + i * 0.26, h / 2, 0.1))
  }
  const edges = faces.map((m) => {
    m.updateMatrix()
    return new EdgesGeometry(m.geometry, 20).applyMatrix4(m.matrix)
  })
  g.add(new Mesh(mergeMeshes(faces), faceMat))
  g.add(new LineSegments(mergeGeometries(edges)!, lineMat))
  edges.forEach((e) => e.dispose())
  faces.forEach((m) => m.geometry.dispose())
  return g
}

/** Project Terminal — a gallery of three exhibits: pedestal, projector cone, rotating hologram. */
export function buildProjects(ctx: StationContext): StationBuild {
  const { kit, path, stopD, trainLength } = ctx
  const group = new Group()
  group.name = 'projects'
  const a = new Anchor(path, stopD - trainLength / 2)

  group.add(platform(kit, a, 0, { side: 1, length: 16, edge: VIOLET }))
  const sign = kit.sign(stationSignTexture({ title: 'Project Terminal', kicker: 'Platform 04 · Selected work', code: 'PT', color: VIOLET }), 3.9, 0.76)
  // Low platform sign at the entrance end, clear of the gallery.
  a.place(sign, 11.2, 2.3, 1.9)
  const post = new Mesh(new BoxGeometry(0.08, 1.3, 0.08), kit.metal)
  a.place(post, 11.2, 2.3, 1.27)
  group.add(sign, post)

  // Gallery floor + back wall.
  const floor = new Mesh(new BoxGeometry(22, 0.18, 8.5), kit.slab)
  a.place(floor, 0, 9.2, 0.09)
  const wall = new Mesh(new BoxGeometry(22, 7.5, 0.4), kit.concrete)
  a.place(wall, 0, 13.3, 3.75)
  const wallLine = new Mesh(new BoxGeometry(21, 0.04, 0.02), kit.light(VIOLET, 0.9))
  a.place(wallLine, 0, 13.09, 6.9)
  group.add(floor, wall, wallLine)
  // Gallery wall washers between the bays.
  for (const x of [-9.9, -3.3, 3.3, 9.9]) {
    const wash = new Mesh(new PlaneGeometry(0.9, 6.6), kit.holo(kit.beam, VIOLET, 0.28))
    a.place(wash, x, 13.08, 3.5, Math.PI)
    const slot = new Mesh(new BoxGeometry(0.5, 0.03, 0.06), kit.light(VIOLET, 1.1))
    a.place(slot, x, 13.06, 0.22)
    group.add(wash, slot)
  }

  const hoverables: Hoverable[] = []
  const exhibits: { id: string; holo: Group; centre: Vector3; ring: MeshBasicMaterial; cone: MeshBasicMaterial; spin: number; active: boolean }[] = []

  projects.forEach((p, i) => {
    // The camera looks from the -R side, where +along reads right-to-left: lay out 01 → 03 left to right.
    const along = 6.6 - i * 6.6
    const side = 9.4
    const bay = new Group()

    // Portal frame.
    const postGeo = new BoxGeometry(0.22, 6.2, 0.22)
    for (const x of [-2.3, 2.3]) {
      const fp = new Mesh(postGeo, kit.metal)
      fp.position.set(x, 3.1 + 0.18, 0)
      bay.add(fp)
    }
    const lintel = new Mesh(new BoxGeometry(4.82, 0.22, 0.22), kit.metal)
    lintel.position.set(0, 6.3, 0)
    const lintelLight = new Mesh(new BoxGeometry(4.3, 0.035, 0.05), kit.light(VIOLET, 1))
    lintelLight.position.set(0, 6.16, -0.12)
    bay.add(lintel, lintelLight)

    // Pedestal with a glowing ring.
    const ped = new Mesh(new CylinderGeometry(0.85, 0.95, 1.0, 32), kit.pearl)
    ped.position.y = 0.68
    const ringMat = new MeshBasicMaterial({ color: new Color(VIOLET).multiplyScalar(0.9), toneMapped: false })
    kit.own(ringMat)
    const ring = new Mesh(new TorusGeometry(0.82, 0.025, 8, 64), ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 1.19
    bay.add(ped, ring)

    // Projector cone.
    const coneMat = new MeshBasicMaterial({
      map: kit.beam,
      color: new Color(VIOLET),
      transparent: true,
      opacity: 0.32,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    kit.own(coneMat)
    const cone = new Mesh(new CylinderGeometry(1.25, 0.7, 2.6, 32, 1, true), coneMat)
    cone.position.y = 1.2 + 1.3
    bay.add(cone)

    // Hologram.
    const lineMat = kit.own(new LineBasicMaterial({ color: new Color('#d9cfff'), transparent: true, opacity: 0.95, toneMapped: false }))
    const faceMat = kit.holo(null, VIOLET, 0.12)
    const holo = miniature(p.motif, lineMat, faceMat)
    holo.position.y = 2.15
    bay.add(holo)

    // Plaque facing the platform.
    const plaque = new Mesh(
      new PlaneGeometry(2.6, 0.62),
      kit.own(
        new MeshBasicMaterial({
          map: labelTexture(p.name, { color: '#eee9ff', sub: `Exhibit ${p.number} · ${p.category}`, border: 'rgba(169,147,255,0.6)', width: 832, height: 200 }),
          toneMapped: false,
        }),
      ),
    )
    plaque.position.set(0, 0.9, -1.35)
    // Faces the platform side and leans back like a lectern toward the raised camera.
    plaque.rotation.set(0.35, Math.PI, 0)
    const plaqueStand = new Mesh(new BoxGeometry(2.7, 0.5, 0.12), kit.metal)
    plaqueStand.position.set(0, 0.72, -1.3)
    plaqueStand.rotation.x = 0.35
    bay.add(plaqueStand, plaque)

    // Generous invisible hit box so the exhibit is easy to point at.
    const hit = new Mesh(new BoxGeometry(2.6, 3.6, 2.6), new MeshBasicMaterial({ visible: false }))
    hit.position.y = 1.9
    bay.add(hit)

    a.place(bay, along, side, 0)
    group.add(bay)
    const centre = a.at(along, side, 2.7)
    const ex = { id: p.id, holo, centre, ring: ringMat, cone: coneMat, spin: i * 1.3, active: false }
    exhibits.push(ex)
    hoverables.push({
      kind: 'project',
      id: p.id,
      targets: [hit],
      setActive(on) {
        ex.active = on
        ringMat.color.set(VIOLET).multiplyScalar(on ? 1.8 : 0.9)
        coneMat.opacity = on ? 0.6 : 0.32
        holo.scale.setScalar(on ? 1.12 : 1)
      },
    })
  })

  return {
    group,
    hoverables,
    update({ dt, reducedMotion }) {
      if (reducedMotion) return
      for (const ex of exhibits) {
        ex.spin += dt * (ex.active ? 0.9 : 0.35)
        ex.holo.rotation.y = ex.spin
      }
    },
    focus(id) {
      const ex = exhibits.find((e) => e.id === id)
      if (!ex) return null
      // Step onto the gallery floor in front of the exhibit, far enough to frame pedestal and hologram.
      const eye = ex.centre.clone().addScaledVector(a.r, -6.8).addScaledVector(a.t, 1.6)
      eye.y += 0.9
      return { eye, look: ex.centre.clone().setY(ex.centre.y - 0.25) }
    },
  }
}
