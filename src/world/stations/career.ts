import { BoxGeometry, Color, Group, Mesh, MeshBasicMaterial, PlaneGeometry, SphereGeometry } from 'three'
import { Anchor, mergeMeshes } from './kit'
import type { StationBuild, StationContext } from './types'
import { labelTexture, makeCanvas, monoFont, displayFont, rrect, toTexture } from '../util/canvas'
import { roles } from '@/data/portfolio'
import { CAREER_FIRST_STOP } from '@/data/stations'

const LIME = '#c6e66b'

function gantrySign(year: string, name: string) {
  const [c, ctx] = makeCanvas(640, 256)
  ctx.fillStyle = '#0b1019'
  rrect(ctx, 0, 0, 640, 256, 26)
  ctx.fill()
  ctx.strokeStyle = 'rgba(198,230,107,0.55)'
  ctx.lineWidth = 4
  rrect(ctx, 3, 3, 634, 250, 24)
  ctx.stroke()
  ctx.fillStyle = LIME
  ctx.fillRect(34, 40, 10, 176)
  displayFont(ctx, 800, 104)
  ctx.fillStyle = '#eef2f8'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(year, 70, 146)
  monoFont(ctx, 500, 30, 4)
  ctx.fillStyle = 'rgba(198,230,107,0.95)'
  ctx.fillText(name.toUpperCase(), 72, 204)
  return toTexture(c)
}

/** The Career Line: one gantry per role across a long straight, lit as the train passes. */
export function buildCareer(ctx: StationContext & { milestones: number[]; nowD: number; startD: number }): StationBuild {
  const { kit, path, milestones, nowD, startD } = ctx
  const group = new Group()
  group.name = 'career'

  const entries = [
    ...roles.map((r, i) => ({ d: milestones[i] - 1.1, year: String(r.start), name: r.short, stop: CAREER_FIRST_STOP + i })),
    { d: nowD, year: 'NOW', name: 'In service', stop: CAREER_FIRST_STOP + roles.length - 1 },
  ]
  const lamps: { mat: MeshBasicMaterial; glow: ReturnType<typeof kit.glowSprite>; stop: number; sign: MeshBasicMaterial }[] = []

  for (const e of entries) {
    const a = new Anchor(path, e.d)
    // Cantilever signal gantry: one post on the far side, the arm reaching over the track,
    // so nothing stands between the tracking camera and the train.
    const gantry = new Group()
    // Steelwork (post, arm, brace, sign backing) merged into one mesh.
    const post = new Mesh(new BoxGeometry(0.24, 4.7, 0.24))
    post.position.set(0, 2.35, 2.3)
    const beam = new Mesh(new BoxGeometry(0.26, 0.34, 3.9))
    beam.position.set(0, 4.45, 0.4)
    const brace = new Mesh(new BoxGeometry(0.1, 0.1, 1.6))
    brace.position.set(0, 3.8, 1.6)
    // Rises from the post toward the arm (toward -Z).
    brace.rotation.x = 0.62
    const sideBack = new Mesh(new BoxGeometry(2.16, 0.9, 0.04))
    sideBack.position.set(0, 5.35, 0.01)
    const steel = [post, beam, brace, sideBack]
    gantry.add(new Mesh(mergeMeshes(steel), kit.metal))

    const signMat = new MeshBasicMaterial({ map: gantrySign(e.year, e.name), toneMapped: false, color: new Color(0.55, 0.55, 0.55) })
    kit.own(signMat)
    // Signs facing up and down the line, plus one turned toward the tracking camera — one mesh.
    const faces: Mesh[] = []
    for (const face of [-1, 1]) {
      const s = new Mesh(new PlaneGeometry(2.5, 1.0))
      s.position.set(0.16 * face, 4.45, 0)
      s.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2
      faces.push(s)
    }
    const sideSign = new Mesh(new PlaneGeometry(2.1, 0.84))
    sideSign.position.set(0, 5.35, -0.02)
    sideSign.rotation.y = Math.PI
    faces.push(sideSign)
    gantry.add(new Mesh(mergeMeshes(faces, ['position', 'normal', 'uv']), signMat))
    ;[...steel, ...faces].forEach((m) => m.geometry.dispose())

    const lampMat = new MeshBasicMaterial({ color: new Color('#26301a'), toneMapped: false })
    kit.own(lampMat)
    const lamp = new Mesh(new SphereGeometry(0.11, 12, 8), lampMat)
    lamp.position.set(0, 4.45, -1.62)
    const glow = kit.glowSprite(LIME, 1.1, 0)
    glow.position.copy(lamp.position)
    gantry.add(lamp, glow)
    lamps.push({ mat: lampMat, glow, stop: e.stop, sign: signMat })

    a.place(gantry, 0, 0, 0)
    group.add(gantry)
  }

  // Timeline ruler on the ground along the camera side.
  const a0 = new Anchor(path, startD)
  const length = nowD - startD + 6
  const ruler = new Mesh(new BoxGeometry(length, 0.012, 0.05), kit.light(LIME, 0.55))
  a0.place(ruler, length / 2 - 3, -2.7, 0.012)
  group.add(ruler)
  for (const e of entries) {
    const a = new Anchor(path, e.d)
    const tick = new Mesh(new BoxGeometry(0.05, 0.014, 0.7), kit.light(LIME, 0.9))
    a.place(tick, 0, -2.7, 0.013)
    const tag = new Mesh(
      new PlaneGeometry(1.5, 0.38),
      kit.own(new MeshBasicMaterial({ map: labelTexture(e.year, { color: LIME, bg: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)', width: 384, height: 96 }), transparent: true, toneMapped: false })),
    )
    tag.rotation.x = -Math.PI / 2
    a.at(0, -3.55, 0.02, tag.position)
    // Flat on the ground, reading left-to-right for the camera on the -R side.
    tag.rotation.z = a.yaw + Math.PI
    group.add(tick, tag)
  }

  return {
    group,
    update({ j }) {
      for (const l of lamps) {
        const passed = j >= l.stop - 0.35
        const current = Math.abs(j - l.stop) < 0.5
        l.mat.color.set(passed ? LIME : '#26301a').multiplyScalar(passed ? 1.4 : 1)
        l.glow.material.opacity = passed ? (current ? 0.95 : 0.55) : 0
        const b = current ? 1 : passed ? 0.8 : 0.55
        l.sign.color.setRGB(b, b, b)
      }
    },
  }
}
