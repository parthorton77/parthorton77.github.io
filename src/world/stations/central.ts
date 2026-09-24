import { BoxGeometry, CanvasTexture, CylinderGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry, TorusGeometry } from 'three'
import { Anchor, mergeMeshes, platform } from './kit'
import type { StationBuild, StationContext } from './types'
import { displayFont, makeCanvas, monoFont, stationSignTexture, toTexture } from '../util/canvas'

const HALL_R = 5.6
const HALL_LEN = 20

/** Parth Central — a ribbed glass hall over both platforms, with a clock tower. */
export function buildCentral(ctx: StationContext): StationBuild {
  const { kit, path, stopD, trainLength } = ctx
  const group = new Group()
  group.name = 'central'
  const a = new Anchor(path, stopD - trainLength / 2)

  group.add(platform(kit, a, 0, { side: 1, length: 18 }))
  group.add(platform(kit, a, 0, { side: -1, length: 18 }))

  // Ribs: slim pearl half-rings spanning the tracks.
  const ribGeo = new TorusGeometry(HALL_R, 0.06, 8, 56, Math.PI)
  ribGeo.rotateY(Math.PI / 2)
  const ribs = 8
  const ribMeshes: Mesh[] = []
  for (let i = 0; i < ribs; i++) {
    const rib = new Mesh(ribGeo)
    a.place(rib, -HALL_LEN / 2 + (i * HALL_LEN) / (ribs - 1), 0, 0)
    ribMeshes.push(rib)
  }
  group.add(new Mesh(mergeMeshes(ribMeshes), kit.pearl))
  ribGeo.dispose()

  // Glass barrel vault.
  const vault = new CylinderGeometry(HALL_R - 0.05, HALL_R - 0.05, HALL_LEN, 40, 1, true, 0, Math.PI)
  vault.rotateZ(Math.PI / 2)
  const glass = new Mesh(vault, kit.glass)
  a.place(glass, 0, 0, 0)
  group.add(glass)

  // Purlins along the vault + a warm light line under the ridge.
  const purlins = [Math.PI / 2, Math.PI / 4, (3 * Math.PI) / 4].map((ang) => {
    const beam = new Mesh(new BoxGeometry(HALL_LEN, 0.08, 0.08))
    a.place(beam, 0, Math.cos(ang) * (HALL_R - 0.02), Math.sin(ang) * (HALL_R - 0.02))
    return beam
  })
  group.add(new Mesh(mergeMeshes(purlins), kit.metal))
  purlins.forEach((m) => m.geometry.dispose())
  const ridge = new Mesh(new BoxGeometry(HALL_LEN - 1, 0.03, 0.12), kit.light('#ffcf8f', 1.1))
  a.place(ridge, 0, 0, HALL_R - 0.22)
  group.add(ridge)
  for (const side of [-1, 1]) {
    const edge = new Mesh(new BoxGeometry(HALL_LEN - 1, 0.03, 0.06), kit.light('#ffb547', 0.8))
    a.place(edge, 0, side * 3.9, 3.35)
    group.add(edge)
  }

  // Rooftop sign on the ridge (two-sided, so it reads from either side of the line).
  const signTex = stationSignTexture({ title: 'Parth Central', kicker: 'Platform 01 · Profile', code: 'PC', color: '#ffb547' })
  const roofSign = kit.sign(signTex, 5.2, 1.02)
  a.place(roofSign, 0, 0, HALL_R + 0.95)
  const mastL = new Mesh(new BoxGeometry(0.06, 0.5, 0.06), kit.metal)
  const mastR = mastL.clone()
  a.place(mastL, -1.9, 0, HALL_R + 0.25)
  a.place(mastR, 1.9, 0, HALL_R + 0.25)
  group.add(roofSign, mastL, mastR)

  // Clock tower on the far side — shows the visitor's own local time.
  const tower = new Group()
  const shaft = new Mesh(new BoxGeometry(1.5, 11, 1.5), kit.concrete)
  shaft.position.y = 5.5
  const cap = new Mesh(new BoxGeometry(1.8, 0.3, 1.8), kit.pearl)
  cap.position.y = 11.15
  const strip = new Mesh(new BoxGeometry(0.06, 9, 0.02), kit.light('#ffb547', 0.9))
  strip.position.set(0, 5, -0.77)
  const clock = makeClock()
  const face = new Mesh(new PlaneGeometry(1.25, 1.25), new MeshBasicMaterial({ map: clock.texture, toneMapped: false, transparent: true }))
  face.position.set(0, 9.9, -0.76)
  face.rotation.y = Math.PI
  const spire = new Mesh(new CylinderGeometry(0.02, 0.05, 1.6, 6), kit.metal)
  spire.position.y = 12.1
  const beacon = kit.glowSprite('#ff5a5a', 0.7, 0.9)
  beacon.position.y = 12.95
  tower.add(shaft, cap, strip, face, spire, beacon)
  a.place(tower, -4.5, 9.5, 0)
  group.add(tower)

  let lastMinute = -1
  return {
    group,
    update({ time }) {
      const now = new Date()
      if (now.getMinutes() !== lastMinute) {
        lastMinute = now.getMinutes()
        clock.draw(now)
      }
      beacon.material.opacity = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(time * 2.2))
    },
    dispose() {
      clock.texture.dispose()
      ;(face.material as MeshBasicMaterial).dispose()
    },
  }
}

function makeClock(): { texture: CanvasTexture; draw(d: Date): void } {
  const [c, ctx] = makeCanvas(256, 256)
  const texture = toTexture(c, 2)
  const draw = (d: Date) => {
    ctx.clearRect(0, 0, 256, 256)
    ctx.fillStyle = '#0b1019'
    ctx.beginPath()
    ctx.arc(128, 128, 124, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffb547'
    ctx.lineWidth = 6
    ctx.stroke()
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2
      ctx.strokeStyle = i % 3 === 0 ? '#eef2f8' : 'rgba(238,242,248,0.5)'
      ctx.lineWidth = i % 3 === 0 ? 7 : 4
      ctx.beginPath()
      ctx.moveTo(128 + Math.sin(ang) * 96, 128 - Math.cos(ang) * 96)
      ctx.lineTo(128 + Math.sin(ang) * 112, 128 - Math.cos(ang) * 112)
      ctx.stroke()
    }
    const h = ((d.getHours() % 12) + d.getMinutes() / 60) / 12
    const m = d.getMinutes() / 60
    const hand = (t: number, len: number, w: number, color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = w
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(128, 128)
      ctx.lineTo(128 + Math.sin(t * Math.PI * 2) * len, 128 - Math.cos(t * Math.PI * 2) * len)
      ctx.stroke()
    }
    hand(h, 58, 10, '#eef2f8')
    hand(m, 86, 6, '#ffb547')
    ctx.fillStyle = '#ffb547'
    ctx.beginPath()
    ctx.arc(128, 128, 8, 0, Math.PI * 2)
    ctx.fill()
    displayFont(ctx, 800, 20)
    ctx.fillStyle = 'rgba(238,242,248,0.7)'
    ctx.textAlign = 'center'
    ctx.fillText('PC', 128, 176)
    monoFont(ctx, 500, 12)
    ctx.fillText('LOCAL TIME', 128, 196)
    texture.needsUpdate = true
  }
  return { texture, draw }
}
