import {
  BoxGeometry,
  CubicBezierCurve3,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { Anchor, platform } from './kit'
import type { StationBuild, StationContext } from './types'
import { displayFont, makeCanvas, monoFont, rrect, stationSignTexture, toTexture } from '../util/canvas'

type Ctx = ReturnType<typeof makeCanvas>[1]
const CORAL = '#ff7d8f'
const INK = 'rgba(238,242,248,0.92)'
const DIM = 'rgba(238,242,248,0.28)'
const FAINT = 'rgba(238,242,248,0.12)'

/** Every artboard shares a frame: translucent fill, hairline border, a label tab. */
function artboard(w: number, h: number, label: string, draw: (ctx: Ctx, w: number, h: number) => void) {
  const [c, ctx] = makeCanvas(w, h)
  ctx.fillStyle = 'rgba(14,20,32,0.72)'
  rrect(ctx, 4, 4, w - 8, h - 8, 26)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,125,143,0.75)'
  ctx.lineWidth = 3
  rrect(ctx, 4, 4, w - 8, h - 8, 26)
  ctx.stroke()
  monoFont(ctx, 500, 20, 2)
  ctx.fillStyle = CORAL
  ctx.fillText(label.toUpperCase(), 30, 44)
  draw(ctx, w, h)
  return toTexture(c)
}

const bar = (ctx: Ctx, x: number, y: number, w: number, h: number, color = DIM, r = 6) => {
  ctx.fillStyle = color
  rrect(ctx, x, y, w, h, r)
  ctx.fill()
}

const panels: { label: string; size: [number, number]; draw: (ctx: Ctx, w: number, h: number) => void }[] = [
  {
    label: 'Wireframe · Landing',
    size: [768, 512],
    draw(ctx) {
      bar(ctx, 30, 70, 708, 34, FAINT, 8)
      ;[60, 96, 132].forEach((x) => bar(ctx, x, 82, 22, 10, DIM, 5))
      // Hero image placeholder with the classic cross.
      ctx.strokeStyle = DIM
      ctx.lineWidth = 2
      ctx.strokeRect(30, 124, 330, 200)
      ctx.beginPath()
      ctx.moveTo(30, 124)
      ctx.lineTo(360, 324)
      ctx.moveTo(360, 124)
      ctx.lineTo(30, 324)
      ctx.stroke()
      bar(ctx, 390, 136, 300, 26, INK)
      bar(ctx, 390, 176, 250, 14, DIM)
      bar(ctx, 390, 200, 270, 14, DIM)
      bar(ctx, 390, 244, 130, 38, CORAL, 19)
      ;[30, 270, 510].forEach((x) => {
        ctx.strokeStyle = FAINT
        ctx.strokeRect(x, 350, 228, 128)
        bar(ctx, x + 16, 366, 90, 12, DIM)
        bar(ctx, x + 16, 390, 180, 10, FAINT)
        bar(ctx, x + 16, 408, 150, 10, FAINT)
      })
    },
  },
  {
    label: 'Component · Button',
    size: [512, 512],
    draw(ctx) {
      const states = [
        ['Default', 'rgba(255,125,143,0.95)'],
        ['Hover', 'rgba(255,160,172,1)'],
        ['Pressed', 'rgba(210,90,110,1)'],
        ['Disabled', 'rgba(238,242,248,0.16)'],
      ]
      states.forEach(([name, color], i) => {
        const y = 86 + i * 96
        bar(ctx, 40, y, 250, 60, color, 30)
        monoFont(ctx, 500, 20, 1)
        ctx.fillStyle = i === 3 ? DIM : '#1a0a0e'
        ctx.fillText('BOARD', 120, y + 38)
        ctx.fillStyle = DIM
        ctx.fillText(name.toUpperCase(), 320, y + 38)
      })
    },
  },
  {
    label: 'Type · Scale',
    size: [512, 512],
    draw(ctx) {
      displayFont(ctx, 800, 170)
      ctx.fillStyle = INK
      ctx.fillText('Aa', 34, 250)
      const rows: [string, number][] = [
        ['Display 64', 30],
        ['Heading 32', 24],
        ['Body 16', 19],
        ['Caption 12', 15],
      ]
      rows.forEach(([t, px], i) => {
        monoFont(ctx, 500, px)
        ctx.fillStyle = i === 0 ? CORAL : DIM
        ctx.fillText(t, 40, 320 + i * 44)
      })
    },
  },
  {
    label: 'Tokens · Colour',
    size: [512, 384],
    draw(ctx) {
      const tokens = ['#ffb547', '#ff7d8f', '#6fd0ff', '#a993ff', '#c6e66b', '#53e0c2']
      tokens.forEach((hex, i) => {
        const x = 50 + (i % 3) * 145
        const y = 120 + Math.floor(i / 3) * 130
        ctx.fillStyle = hex
        ctx.beginPath()
        ctx.arc(x + 30, y, 32, 0, Math.PI * 2)
        ctx.fill()
        monoFont(ctx, 500, 17)
        ctx.fillStyle = DIM
        ctx.fillText(hex.toUpperCase(), x - 2, y + 62)
      })
    },
  },
  {
    label: 'Mobile · 375',
    size: [384, 640],
    draw(ctx) {
      ctx.strokeStyle = DIM
      ctx.lineWidth = 3
      rrect(ctx, 70, 70, 244, 520, 36)
      ctx.stroke()
      bar(ctx, 160, 86, 64, 10, DIM, 5)
      for (let i = 0; i < 6; i++) {
        const y = 130 + i * 72
        ctx.fillStyle = i === 1 ? 'rgba(255,125,143,0.9)' : FAINT
        ctx.beginPath()
        ctx.arc(112, y + 20, 18, 0, Math.PI * 2)
        ctx.fill()
        bar(ctx, 142, y + 8, 130, 12, i === 1 ? INK : DIM)
        bar(ctx, 142, y + 28, 90, 9, FAINT)
      }
    },
  },
  {
    label: 'Layout · 12 col',
    size: [640, 400],
    draw(ctx) {
      const cols = 12
      const gw = 580
      const gap = 10
      const cw = (gw - gap * (cols - 1)) / cols
      for (let i = 0; i < cols; i++) {
        ctx.fillStyle = 'rgba(255,125,143,0.12)'
        ctx.fillRect(30 + i * (cw + gap), 70, cw, 300)
      }
      ctx.strokeStyle = 'rgba(255,125,143,0.9)'
      ctx.lineWidth = 3
      ctx.strokeRect(30, 110, cw * 8 + gap * 7, 120)
      ctx.strokeRect(30 + (cw + gap) * 8, 110, cw * 4 + gap * 3, 240)
      ctx.strokeRect(30, 250, cw * 8 + gap * 7, 100)
    },
  },
  {
    label: 'Card · Visual',
    size: [512, 512],
    draw(ctx) {
      const g = ctx.createLinearGradient(40, 80, 470, 280)
      g.addColorStop(0, 'rgba(255,125,143,0.85)')
      g.addColorStop(1, 'rgba(169,147,255,0.85)')
      ctx.fillStyle = g
      rrect(ctx, 40, 80, 432, 210, 18)
      ctx.fill()
      displayFont(ctx, 800, 34)
      ctx.fillStyle = INK
      ctx.fillText('NEXT STATION', 40, 344)
      bar(ctx, 40, 366, 300, 14, DIM)
      bar(ctx, 40, 390, 240, 14, FAINT)
      bar(ctx, 40, 424, 150, 44, CORAL, 22)
    },
  },
]

/** Design District — floating artboards, a giant pen-tool curve and a layout grid wall. */
export function buildDesign(ctx: StationContext): StationBuild {
  const { kit, path, stopD, trainLength, eye } = ctx
  const group = new Group()
  group.name = 'design'
  const a = new Anchor(path, stopD - trainLength / 2)

  group.add(platform(kit, a, 0, { side: -1, length: 15, edge: CORAL }))
  const sign = kit.sign(stationSignTexture({ title: 'Design District', kicker: 'Platform 02 · UI · UX · Graphics', code: 'DD', color: CORAL }), 3.8, 0.74)
  a.place(sign, 1.5, -2.9, 2.6)
  const post = new Mesh(new BoxGeometry(0.08, 2, 0.08), kit.metal)
  a.place(post, 1.5, -2.9, 1.0 + 0.62)
  group.add(sign, post)

  // Floating artboards, each turned toward the station camera.
  const layout: [number, number, number, number][] = [
    // along, side, up, scale
    [-6.4, -5.6, 4.4, 4.2],
    [-1.6, -7.6, 7.0, 3.0],
    [2.4, -4.9, 4.6, 2.8],
    [6.4, -6.8, 7.2, 2.7],
    [9.0, -4.6, 3.6, 2.2],
    [-10.4, -8.6, 7.8, 3.4],
    [4.4, -10.4, 3.4, 3.2],
  ]
  const floaters: { mesh: Mesh; baseY: number; phase: number }[] = []
  panels.forEach((p, i) => {
    const [along, side, up, scale] = layout[i]
    const tex = artboard(p.size[0], p.size[1], p.label, p.draw)
    const aspect = p.size[1] / p.size[0]
    const mesh = new Mesh(new PlaneGeometry(scale, scale * aspect), kit.holo(tex, '#ffffff', 0.95))
    a.at(along, side, up, mesh.position)
    mesh.lookAt(eye.x, mesh.position.y + (eye.y - mesh.position.y) * 0.4, eye.z)
    group.add(mesh)
    floaters.push({ mesh, baseY: mesh.position.y, phase: i * 1.7 })
  })

  // Pen-tool Bézier with anchor squares and handles.
  const p0 = a.at(-11, -3.5, 8.6)
  const p3 = a.at(10, -12, 5.2)
  const c1 = a.at(-4, -1.5, 12.5)
  const c2 = a.at(4, -14, 1.2)
  const curve = new CubicBezierCurve3(p0, c1, c2, p3)
  group.add(new Mesh(new TubeGeometry(curve, 96, 0.035, 6, false), kit.light(CORAL, 1.1)))
  const handleMat = kit.light('#eef2f8', 0.8)
  const knobs: Mesh[] = []
  for (const [anchor, control] of [
    [p0, c1],
    [p3, c2],
  ] as const) {
    const sq = new Mesh(new BoxGeometry(0.28, 0.28, 0.28), handleMat)
    sq.position.copy(anchor)
    const knob = new Mesh(new SphereGeometry(0.14, 14, 10), kit.light(CORAL, 1.2))
    knob.position.copy(control)
    const dir = new Vector3().subVectors(control, anchor)
    const stick = new Mesh(new BoxGeometry(0.02, 0.02, dir.length()), handleMat)
    stick.position.copy(anchor).addScaledVector(dir, 0.5)
    stick.lookAt(control)
    group.add(sq, knob, stick)
    knobs.push(knob)
  }

  // Layout grid wall far behind: twelve columns of faint light.
  const gridMat = kit.holo(null, CORAL, 0.07)
  for (let i = 0; i < 12; i++) {
    const col = new Mesh(new PlaneGeometry(1.05, 9), gridMat)
    a.place(col, -8.5 + i * 1.5, -15.5, 4.5)
    group.add(col)
  }
  const gridEdge = new Mesh(new BoxGeometry(18.2, 0.04, 0.04), kit.light(CORAL, 0.8))
  a.place(gridEdge, -0.25, -15.5, 9.05)
  group.add(gridEdge)

  return {
    group,
    update({ time, reducedMotion }) {
      if (reducedMotion) return
      for (const f of floaters) f.mesh.position.y = f.baseY + Math.sin(time * 0.55 + f.phase) * 0.14
      knobs.forEach((k, i) => k.scale.setScalar(1 + 0.18 * Math.sin(time * 1.6 + i * 2)))
    },
    dispose() {
      floaters.forEach((f) => ((f.mesh.material as MeshBasicMaterial).map?.dispose()))
    },
  }
}
