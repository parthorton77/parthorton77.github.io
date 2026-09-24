import { BoxGeometry, Color, CylinderGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry, SphereGeometry } from 'three'
import { Anchor, canopy, lampPost, platform } from './kit'
import type { StationBuild, StationContext } from './types'
import { labelTexture, makeCanvas, stationSignTexture, toTexture } from '../util/canvas'

/** Platform 0: where the visitor boards. A cantilevered canopy, a departure board and a signal. */
export function buildDepot(ctx: StationContext): StationBuild & { setSignal(go: boolean): void } {
  const { kit, path, stopD, trainLength } = ctx
  const group = new Group()
  group.name = 'depot'
  const a = new Anchor(path, stopD - trainLength / 2)

  group.add(platform(kit, a, 0, { side: 1, length: 16 }))
  group.add(canopy(kit, a, 0, { side: 1, length: 15, height: 3.2 }))
  // Lamps on the far side only, so nothing stands between the camera and the train.
  for (const x of [-6, 0, 6]) group.add(lampPost(kit, a, x, 5.25, 2.4))

  // Station building behind the platform: dark glazing with a warm, uneven interior glow.
  const hall = new Mesh(new BoxGeometry(12, 3.4, 3.2), kit.concrete)
  a.place(hall, -1, 6.4, 1.7)
  const facade = new Mesh(new PlaneGeometry(10.8, 2.2), new MeshBasicMaterial({ map: facadeTexture(), toneMapped: false }))
  a.place(facade, -1, 4.785, 1.55, Math.PI)
  group.add(hall, facade)

  // Hanging station sign.
  const sign = kit.sign(stationSignTexture({ title: 'Parth Metro', kicker: 'Platform 0 · Departures', code: 'P0', color: '#ffb547' }), 3.6, 0.7)
  a.place(sign, 1.5, 1.95, 2.6, 0)
  group.add(sign)

  // Departure board on a post at the platform end.
  const board = kit.sign(labelTexture('NEXT › PARTH CENTRAL', { color: '#ffb547', width: 768, height: 128 }), 2.3, 0.38)
  const boardPost = new Mesh(new CylinderGeometry(0.04, 0.05, 2.1, 8), kit.metal)
  a.place(boardPost, 6.3, 1.35, 1.05 + 0.62)
  a.place(board, 6.3, 1.35, 2.5, 0)
  group.add(boardPost, board)

  // Signal ahead of the train, on the left: red while boarding, green on departure.
  const signal = new Group()
  const pole = new Mesh(new CylinderGeometry(0.05, 0.07, 3.1, 8), kit.metal)
  pole.position.y = 1.55
  const head = new Mesh(new BoxGeometry(0.22, 0.62, 0.3), kit.metal)
  head.position.y = 3.05
  const hood = new Mesh(new BoxGeometry(0.1, 0.62, 0.34), kit.concrete)
  hood.position.set(0.06, 3.05, 0)
  const red = new Mesh(new SphereGeometry(0.075, 12, 8), new MeshBasicMaterial({ color: new Color('#ff3b3b').multiplyScalar(1.6), toneMapped: false }))
  red.position.set(-0.12, 3.2, 0)
  const green = new Mesh(new SphereGeometry(0.075, 12, 8), new MeshBasicMaterial({ color: new Color('#1d2a22'), toneMapped: false }))
  green.position.set(-0.12, 2.92, 0)
  const redGlow = kit.glowSprite('#ff4a4a', 0.9, 0.9)
  redGlow.position.copy(red.position).x -= 0.05
  const greenGlow = kit.glowSprite('#47ffa1', 0.9, 0)
  greenGlow.position.copy(green.position).x -= 0.05
  signal.add(pole, head, hood, red, green, redGlow, greenGlow)
  // Lamps sit on the head's -X face, i.e. facing the waiting train.
  a.place(signal, trainLength / 2 + 3.4, -1.25, 0)
  group.add(signal)

  const redMat = red.material as MeshBasicMaterial
  const greenMat = green.material as MeshBasicMaterial
  const setSignal = (go: boolean) => {
    redMat.color.set(go ? '#2a1717' : '#ff3b3b').multiplyScalar(go ? 1 : 1.6)
    greenMat.color.set(go ? '#3dff9a' : '#1d2a22').multiplyScalar(go ? 1.5 : 1)
    redGlow.material.opacity = go ? 0 : 0.9
    greenGlow.material.opacity = go ? 0.95 : 0
  }

  return {
    group,
    setSignal,
    dispose() {
      redMat.dispose()
      greenMat.dispose()
      ;(facade.material as MeshBasicMaterial).map?.dispose()
      ;(facade.material as MeshBasicMaterial).dispose()
    },
  }
}

/** Night-time glazing: dark panes, a few warmly lit bays, a ceiling light line. */
function facadeTexture() {
  const [c, ctx] = makeCanvas(1024, 208)
  ctx.fillStyle = '#0a111c'
  ctx.fillRect(0, 0, 1024, 208)
  const bays = 9
  const w = 1024 / bays
  const levels = [0.55, 0.22, 0.8, 0.35, 0.18, 0.7, 0.3, 0.6, 0.25]
  for (let i = 0; i < bays; i++) {
    const g = ctx.createLinearGradient(0, 20, 0, 208)
    g.addColorStop(0, `rgba(255, 205, 140, ${levels[i] * 0.55})`)
    g.addColorStop(1, `rgba(255, 170, 90, ${levels[i] * 0.18})`)
    ctx.fillStyle = g
    ctx.fillRect(i * w + 6, 18, w - 12, 186)
  }
  ctx.fillStyle = 'rgba(255, 220, 170, 0.9)'
  ctx.fillRect(0, 8, 1024, 5)
  ctx.fillStyle = '#1b2331'
  for (let i = 0; i <= bays; i++) ctx.fillRect(i * w - 3, 0, 6, 208)
  return toTexture(c)
}
