import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  Shape,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { TrackPath } from '../track/TrackPath'
import { RAIL_TOP } from '../track/trackMesh'
import { TRAIN } from '../track/route'
import { glowTexture, makeCanvas, rrect, toTexture } from '../util/canvas'

const WIDTH = 1.02
const HEIGHT = 1.0
const BEVEL = 0.09
const WHEEL_R = 0.15
/** Body floor above the rail head. */
const RIDE = 0.36
const BOGIE_INSET = 0.62
const WHEELBASE = 0.62

type CarKind = 'lead' | 'middle' | 'tail'

interface Car {
  kind: CarKind
  length: number
  group: Group
}

function noseProfile(L: number, H: number): Shape {
  const s = new Shape()
  s.moveTo(0.14, 0)
  s.lineTo(L - 0.66, 0)
  // Chin, then a long sweep up the windscreen to the roof.
  s.bezierCurveTo(L - 0.2, 0, L + 0.02, 0.12, L - 0.01, 0.36)
  s.bezierCurveTo(L - 0.05, 0.62, L - 0.5, H - 0.03, L - 1.12, H)
  s.lineTo(0.16, H)
  s.quadraticCurveTo(0, H, 0, H - 0.16)
  s.lineTo(0, 0.14)
  s.quadraticCurveTo(0, 0, 0.14, 0)
  return s
}

function boxProfile(L: number, H: number): Shape {
  const s = new Shape()
  const r = 0.16
  s.moveTo(r, 0)
  s.lineTo(L - r, 0)
  s.quadraticCurveTo(L, 0, L, r)
  s.lineTo(L, H - r)
  s.quadraticCurveTo(L, H, L - r, H)
  s.lineTo(r, H)
  s.quadraticCurveTo(0, H, 0, H - r)
  s.lineTo(0, r)
  s.quadraticCurveTo(0, 0, r, 0)
  return s
}

/** Car side livery: pearl body, dark glazing band, lit windows, a thin amber line. */
function liveryTextures(L: number, nose: boolean): { map: CanvasTexture; emissive: CanvasTexture } {
  const pxPerUnit = 340
  const w = Math.round(L * pxPerUnit)
  const h = Math.round(HEIGHT * pxPerUnit)
  const [c, ctx] = makeCanvas(w, h)
  const [ec, ectx] = makeCanvas(w, h)
  const X = (u: number) => u * pxPerUnit
  const Y = (v: number) => h - v * pxPerUnit

  const body = ctx.createLinearGradient(0, 0, 0, h)
  body.addColorStop(0, '#f4f6fa')
  body.addColorStop(0.55, '#e6eaf0')
  body.addColorStop(1, '#c9d0da')
  ctx.fillStyle = body
  ctx.fillRect(0, 0, w, h)
  ectx.fillStyle = '#000'
  ectx.fillRect(0, 0, w, h)

  // Lower skirt tone.
  ctx.fillStyle = '#2a3140'
  ctx.fillRect(0, Y(0.16), w, h)

  const bandEnd = nose ? L - 1.2 : L - 0.2
  const bandStart = 0.2
  // Glazing band.
  const glass = ctx.createLinearGradient(0, Y(0.84), 0, Y(0.48))
  glass.addColorStop(0, '#1a2332')
  glass.addColorStop(1, '#0a0f17')
  ctx.fillStyle = glass
  rrect(ctx, X(bandStart), Y(0.84), X(bandEnd - bandStart), X(0.36), X(0.07))
  ctx.fill()

  // Warm cabin light behind the windows (emissive), split by mullions.
  const panes = Math.max(2, Math.round((bandEnd - bandStart) / 0.48))
  const paneW = (bandEnd - bandStart) / panes
  for (let i = 0; i < panes; i++) {
    const x0 = bandStart + i * paneW + 0.035
    const lit = ectx.createLinearGradient(0, Y(0.82), 0, Y(0.5))
    lit.addColorStop(0, 'rgba(255, 214, 160, 0.55)')
    lit.addColorStop(1, 'rgba(255, 190, 120, 0.25)')
    ectx.fillStyle = lit
    rrect(ectx, X(x0), Y(0.81), X(paneW - 0.07), X(0.3), X(0.04))
    ectx.fill()
    // Mullion
    ctx.fillStyle = 'rgba(210, 218, 230, 0.9)'
    ctx.fillRect(X(bandStart + i * paneW) - 2, Y(0.84), 4, X(0.36))
  }
  // Reflection sweep across the glass.
  const sheen = ctx.createLinearGradient(X(bandStart), 0, X(bandEnd), 0)
  sheen.addColorStop(0, 'rgba(255,255,255,0)')
  sheen.addColorStop(0.45, 'rgba(255,255,255,0.10)')
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.0)')
  ctx.fillStyle = sheen
  rrect(ctx, X(bandStart), Y(0.84), X(bandEnd - bandStart), X(0.36), X(0.07))
  ctx.fill()

  // Doors (outline + slim window).
  const doors = nose ? [0.62] : [0.55, L - 0.55]
  for (const dx of doors) {
    ctx.strokeStyle = 'rgba(80, 92, 112, 0.55)'
    ctx.lineWidth = 3
    rrect(ctx, X(dx - 0.2), Y(0.9), X(0.4), X(0.72), X(0.05))
    ctx.stroke()
    ctx.fillStyle = '#0c121c'
    rrect(ctx, X(dx - 0.13), Y(0.82), X(0.26), X(0.34), X(0.04))
    ctx.fill()
    ectx.fillStyle = 'rgba(255, 205, 150, 0.4)'
    rrect(ectx, X(dx - 0.11), Y(0.8), X(0.22), X(0.3), X(0.035))
    ectx.fill()
  }

  // Signature line.
  const lineEnd = nose ? L - 0.55 : L
  ctx.fillStyle = '#ffb547'
  ctx.fillRect(0, Y(0.33), X(lineEnd), X(0.035))
  ectx.fillStyle = 'rgba(255, 181, 71, 0.9)'
  ectx.fillRect(0, Y(0.33), X(lineEnd), X(0.035))

  const map = toTexture(c)
  const emissive = toTexture(ec)
  for (const t of [map, emissive]) t.repeat.set(1 / L, 1 / HEIGHT)
  return { map, emissive }
}

/**
 * Wraparound windscreen: a band that follows the nose's upper curve, sitting a hair
 * proud of the body so it reads as one piece of dark glass sweeping over the cab.
 */
function windscreenGeometry(L: number, H: number): ExtrudeGeometry {
  // Same cubic as the body's windscreen sweep (see noseProfile).
  const p0 = [L - 0.01, 0.36]
  const c1 = [L - 0.05, 0.62]
  const c2 = [L - 0.5, H - 0.03]
  const p3 = [L - 1.12, H]
  const at = (t: number) => {
    const u = 1 - t
    const a = u * u * u
    const b = 3 * u * u * t
    const c = 3 * u * t * t
    const d = t * t * t
    return [a * p0[0] + b * c1[0] + c * c2[0] + d * p3[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p3[1]]
  }
  const outer: [number, number][] = []
  const inner: [number, number][] = []
  const steps = 18
  for (let i = 0; i <= steps; i++) {
    const t = 0.16 + (i / steps) * 0.7
    const [x, y] = at(t)
    const [x2, y2] = at(Math.min(1, t + 0.01))
    const dx = x2 - x
    const dy = y2 - y
    const len = Math.hypot(dx, dy) || 1
    const nx = dy / len
    const ny = -dx / len
    // The body's 0.05 bevel grows its outline, so the glass sits just outside that.
    outer.push([x + nx * 0.058, y + ny * 0.058])
    inner.push([x - nx * 0.18, y - ny * 0.18])
  }
  const s = new Shape()
  s.moveTo(...outer[0])
  outer.slice(1).forEach((p) => s.lineTo(...p))
  inner.reverse().forEach((p) => s.lineTo(...p))
  s.closePath()
  const inset = 0.07
  const geo = new ExtrudeGeometry(s, {
    depth: WIDTH - BEVEL * 2 - inset * 2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.012,
    bevelSegments: 3,
    curveSegments: 8,
  })
  geo.translate(-L / 2, 0, -(WIDTH - BEVEL * 2 - inset * 2) / 2)
  return geo
}

function taperNose(g: BufferGeometry, L: number) {
  // Pinch the width toward the tip so the nose reads as rounded from above, not a wedge.
  const pos = g.getAttribute('position')
  const start = L - 1.25
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    if (x > start) {
      const t = Math.min(1, (x - start) / 1.3)
      pos.setZ(i, pos.getZ(i) * (1 - 0.3 * t * t))
    }
  }
  pos.needsUpdate = true
  g.computeVertexNormals()
}

function wheelGeometry(): BufferGeometry {
  const tire = new CylinderGeometry(WHEEL_R, WHEEL_R, 0.07, 22)
  const hub = new CylinderGeometry(WHEEL_R * 0.62, WHEEL_R * 0.62, 0.075, 18)
  const spoke = new BoxGeometry(WHEEL_R * 1.5, 0.078, 0.035)
  const paint = (geo: BufferGeometry, c: Color) => {
    const n = geo.getAttribute('position').count
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3)
    geo.setAttribute('color', new Float32BufferAttribute(arr, 3))
    return geo
  }
  const merged = mergeGeometries([
    paint(tire, new Color('#262d39')),
    paint(hub, new Color('#aeb8c8')),
    paint(spoke, new Color('#e3e8ef')),
  ])!
  merged.rotateX(Math.PI / 2) // axle along Z
  return merged
}

export class Train {
  readonly group = new Group()
  private cars: Car[] = []
  private bogies: Group[] = []
  private wheels: InstancedMesh
  private headGlow: Sprite
  private beam: Mesh
  private lampMat: MeshBasicMaterial
  private readonly v = { a: new Vector3(), b: new Vector3(), t: new Vector3(), r: new Vector3(), up: new Vector3() }
  private readonly m = new Matrix4()
  private readonly q = new Quaternion()
  private readonly basis = new Matrix4()
  private readonly wheelLocal = new Matrix4()
  private readonly wheelRot = new Matrix4()
  private materials: Material[] = []

  constructor() {
    this.group.name = 'train'
    const shell = new MeshStandardMaterial({ color: '#e9edf3', roughness: 0.3, metalness: 0.12 })
    const glass = new MeshStandardMaterial({ color: '#070b12', roughness: 0.06, metalness: 0.8 })
    const dark = new MeshStandardMaterial({ color: '#171d28', roughness: 0.55, metalness: 0.45 })
    const accent = new MeshBasicMaterial({ color: '#ffb547', toneMapped: false })
    this.lampMat = new MeshBasicMaterial({ color: new Color('#fff1d6').multiplyScalar(1.6), toneMapped: false })
    const tailMat = new MeshBasicMaterial({ color: new Color('#ff3844').multiplyScalar(1.4), toneMapped: false })
    this.materials.push(shell, glass, dark, accent, this.lampMat, tailMat)

    const kinds: CarKind[] = ['lead', 'middle', 'tail']
    kinds.forEach((kind, i) => {
      const L = TRAIN.carLengths[i]
      const car = this.buildCar(kind, L, { shell, glass, dark, accent, lamp: kind === 'tail' ? tailMat : this.lampMat })
      this.cars.push({ kind, length: L, group: car })
      this.group.add(car)
    })

    // Gangway bellows between cars.
    for (let i = 0; i < this.cars.length - 1; i++) {
      const bellows = new Mesh(new BoxGeometry(0.5, 0.78, 0.8), dark)
      bellows.name = 'gangway'
      this.group.add(bellows)
    }

    // Bogies: frames + instanced wheels (one draw call for all 24).
    const frameGeo = new BoxGeometry(WHEELBASE + 0.42, 0.12, 0.62)
    for (let i = 0; i < this.cars.length * 2; i++) {
      const bogie = new Group()
      const frame = new Mesh(frameGeo, dark)
      frame.position.y = WHEEL_R + 0.02
      bogie.add(frame)
      this.bogies.push(bogie)
      this.group.add(bogie)
    }
    const wheelMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.75 })
    this.materials.push(wheelMat)
    this.wheels = new InstancedMesh(wheelGeometry(), wheelMat, this.bogies.length * 4)
    this.wheels.frustumCulled = false
    this.group.add(this.wheels)

    // Headlight glow and the pool of light it throws down the track.
    const glowMat = new SpriteMaterial({
      map: glowTexture(128),
      color: new Color('#ffe3b5'),
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.85,
    })
    this.headGlow = new Sprite(glowMat)
    this.headGlow.scale.set(2.4, 1.3, 1)
    this.headGlow.position.set(TRAIN.carLengths[0] / 2 + 0.12, 0.3, 0)
    this.cars[0].group.add(this.headGlow)

    const [bc, bctx] = makeCanvas(256, 128)
    const grad = bctx.createRadialGradient(40, 64, 4, 90, 64, 150)
    grad.addColorStop(0, 'rgba(255,230,190,0.55)')
    grad.addColorStop(1, 'rgba(255,230,190,0)')
    bctx.fillStyle = grad
    bctx.fillRect(0, 0, 256, 128)
    const beamMat = new MeshBasicMaterial({
      map: toTexture(bc, 1),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      opacity: 0.6,
    })
    this.beam = new Mesh(new PlaneGeometry(5, 2.2), beamMat)
    this.beam.rotation.x = -Math.PI / 2
    this.beam.position.set(TRAIN.carLengths[0] / 2 + 2.4, -RIDE + 0.02, 0)
    this.cars[0].group.add(this.beam)
    this.materials.push(glowMat, beamMat)
  }

  private buildCar(
    kind: CarKind,
    L: number,
    m: { shell: Material; glass: Material; dark: Material; accent: Material; lamp: Material },
  ): Group {
    const g = new Group()
    g.name = `car-${kind}`
    const nose = kind !== 'middle'
    const shape = nose ? noseProfile(L, HEIGHT) : boxProfile(L, HEIGHT)
    const geo = new ExtrudeGeometry(shape, {
      depth: WIDTH - BEVEL * 2,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: 0.05,
      bevelSegments: 5,
      curveSegments: 20,
    })
    geo.translate(-L / 2, 0, -(WIDTH - BEVEL * 2) / 2)
    if (nose) taperNose(geo, L / 2)

    const livery = liveryTextures(L, nose)
    const side = new MeshStandardMaterial({
      map: livery.map,
      emissiveMap: livery.emissive,
      emissive: new Color('#ffffff'),
      emissiveIntensity: 1.1,
      roughness: 0.32,
      metalness: 0.1,
    })
    this.materials.push(side)
    const body = new Mesh(geo, [side, m.shell])
    g.add(body)

    // Underbody skirt hides the bogie tops.
    const skirt = new Mesh(new BoxGeometry(L - 0.5, 0.16, WIDTH - 0.22), m.dark)
    skirt.position.y = -0.04
    g.add(skirt)

    // Roof pod + pantograph (lead) / roof pod (others).
    const pod = new Mesh(new BoxGeometry(nose ? 0.9 : 1.1, 0.07, 0.5), m.dark)
    pod.position.set(nose ? -L / 2 + 0.75 : 0, HEIGHT + 0.07, 0)
    g.add(pod)
    if (kind === 'lead') g.add(this.pantograph(m.dark, -L / 2 + 0.75))

    if (nose) {
      const screen = windscreenGeometry(L, HEIGHT)
      taperNose(screen, L / 2)
      g.add(new Mesh(screen, m.glass))

      // Lamps + LED brow.
      for (const z of [-0.3, 0.3]) {
        const lamp = new Mesh(new CapsuleGeometry(0.045, 0.1, 4, 10), m.lamp)
        lamp.rotation.x = Math.PI / 2
        lamp.position.set(L / 2 + 0.035, 0.26, z)
        g.add(lamp)
      }
      const brow = new Mesh(new BoxGeometry(0.03, 0.025, 0.52), m.accent)
      brow.position.set(L / 2 - 0.02, 0.42, 0)
      g.add(brow)
    }

    return g
  }

  private pantograph(mat: Material, x: number): Group {
    const g = new Group()
    const armGeo = new BoxGeometry(0.44, 0.022, 0.022)
    const a = new Mesh(armGeo, mat)
    a.position.set(-0.12, 0.17, 0)
    a.rotation.z = 0.62
    const b = new Mesh(armGeo, mat)
    b.position.set(0.12, 0.17, 0)
    b.rotation.z = -0.62
    const head = new Mesh(new BoxGeometry(0.06, 0.02, 0.56), mat)
    head.position.set(0, 0.31, 0)
    g.add(a, b, head)
    g.position.set(x, HEIGHT + 0.1, 0)
    return g
  }

  /** Lay the whole consist onto the track with its nose at distance `front`. */
  update(path: TrackPath, front: number) {
    const { a, b, t, r, up } = this.v
    let cursor = front
    const carFronts: number[] = []
    let bogieIndex = 0
    let wheelIndex = 0
    const spin = -front / WHEEL_R

    this.cars.forEach((car) => {
      const L = car.length
      carFronts.push(cursor)
      const df = cursor - BOGIE_INSET
      const dr = cursor - L + BOGIE_INSET

      // Bogies ride the rails exactly; the body hangs between them on the chord.
      for (const d of [df, dr]) {
        const bogie = this.bogies[bogieIndex++]
        path.point(d, bogie.position)
        path.tangent(d, t)
        bogie.rotation.set(0, Math.atan2(-t.z, t.x), 0)
        bogie.updateMatrix()
        for (const [wx, wz] of [
          [WHEELBASE / 2, -0.36],
          [WHEELBASE / 2, 0.36],
          [-WHEELBASE / 2, -0.36],
          [-WHEELBASE / 2, 0.36],
        ]) {
          this.wheelLocal.makeTranslation(wx, RAIL_TOP + WHEEL_R - 0.01, wz)
          this.wheelRot.makeRotationZ(spin)
          this.m.multiplyMatrices(bogie.matrix, this.wheelLocal).multiply(this.wheelRot)
          this.wheels.setMatrixAt(wheelIndex++, this.m)
        }
        bogie.position.y += RAIL_TOP - 0.02
      }

      path.point(df, a)
      path.point(dr, b)
      t.subVectors(a, b).normalize()
      // Gentle cant into curves (positive curvature turns right, so lean right).
      const k = path.curvature((df + dr) / 2)
      up.set(0, 1, 0)
      TrackPath.right(t, r)
      up.addScaledVector(r, k * 1.6).normalize()
      r.crossVectors(t, up).normalize()
      up.crossVectors(r, t).normalize()
      if (car.kind === 'tail') {
        t.negate()
        r.negate()
      }
      this.basis.makeBasis(t, up, r)
      this.q.setFromRotationMatrix(this.basis)
      car.group.quaternion.copy(this.q)
      car.group.position.addVectors(a, b).multiplyScalar(0.5)
      car.group.position.y += RAIL_TOP + RIDE

      cursor -= L + TRAIN.gap
    })

    // Gangways sit centred between neighbouring cars.
    let gi = 0
    this.group.children.forEach((child) => {
      if (child.name !== 'gangway') return
      const dEnd = carFronts[gi] - this.cars[gi].length
      const dMid = dEnd - TRAIN.gap / 2
      path.point(dMid, child.position)
      child.position.y += RAIL_TOP + RIDE + 0.48
      path.tangent(dMid, t)
      child.rotation.set(0, Math.atan2(-t.z, t.x), 0)
      gi++
    })

    this.wheels.instanceMatrix.needsUpdate = true
  }

  /** Headlights flare slightly when departing. */
  setLampBoost(v: number) {
    this.headGlow.material.opacity = 0.7 + v * 0.3
    this.headGlow.scale.set(2.4 + v * 0.8, 1.3 + v * 0.3, 1)
  }

  dispose() {
    this.group.traverse((o) => {
      if (o instanceof Mesh || o instanceof InstancedMesh) o.geometry.dispose()
    })
    this.materials.forEach((mat) => {
      const withMaps = mat as MeshStandardMaterial
      withMaps.map?.dispose()
      withMaps.emissiveMap?.dispose()
      mat.dispose()
    })
  }
}
