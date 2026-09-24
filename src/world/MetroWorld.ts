import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  MathUtils,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { buildRoute, stopDistances, TRAIN } from './track/route'
import { TrackPath } from './track/TrackPath'
import { buildTrack, buildTunnel } from './track/trackMesh'
import { Train } from './train/Train'
import { CameraDirector, type Shot } from './camera/CameraDirector'
import { buildEnvironment, buildGround, buildSky, HORIZON, type Sky } from './scene/environment'
import { Kit } from './stations/kit'
import { buildDepot } from './stations/depot'
import { buildCentral } from './stations/central'
import { buildDesign } from './stations/design'
import { buildEngineering } from './stations/engineering'
import { buildProjects } from './stations/projects'
import { buildCareer } from './stations/career'
import { buildAiLab } from './stations/ailab'
import { buildFinal } from './stations/final'
import { buildCity } from './scene/city'
import type { FrameState, Hoverable, StationBuild, StationContext } from './stations/types'
import { stations, stops, type StationId } from '@/data/stations'

export interface WorldOptions {
  reducedMotion: boolean
  onHover?(target: { kind: Hoverable['kind']; id: string } | null): void
  onSelect?(target: { kind: Hoverable['kind']; id: string }): void
  /** Journey value source (read every frame). */
  journey(): number
}

const MAX_DPR = 1.75
const UP = new Vector3(0, 1, 0)

export class MetroWorld {
  readonly renderer: WebGLRenderer
  readonly scene = new Scene()
  readonly camera = new PerspectiveCamera(40, 1, 0.1, 1400)
  readonly path: TrackPath
  readonly director: CameraDirector
  private readonly train = new Train()
  private readonly kit = new Kit()
  private sky?: Sky
  private env?: Texture
  private disposed = false
  /** Adaptive-resolution ceiling; lowered when frames run slow. */
  private dprCap = MAX_DPR
  private stationBuilds = new Map<StationId, StationBuild>()
  private stationCentres = new Map<StationId, Vector3>()
  private hoverables: Hoverable[] = []
  private depot!: ReturnType<typeof buildDepot>
  private aiLab?: ReturnType<typeof buildAiLab>
  private city?: ReturnType<typeof buildCity>

  private width = 1
  private height = 1
  private dpr = 1
  private raf = 0
  private running = false
  private lastTime = 0
  private lastRender = 0
  private lastJ = -1
  private idleFor = 0
  private needsRender = true
  private frameTimes: number[] = []
  private readonly clockStart = performance.now()

  private readonly pointer = new Vector2(0, 0)
  private readonly pointerDamped = new Vector2(0, 0)
  private pointerClient: { x: number; y: number } | null = null
  private pointerOverUi = true
  private readonly raycaster = new Raycaster()
  private hovered: Hoverable | null = null

  /** Extra camera shot (e.g. zooming into a project) blended over the journey shot. */
  private focusShot: { eye: Vector3; look: Vector3 } | null = null
  private focusWeight = 0
  private focusTarget = 0
  private readonly finalShot: Shot = { eye: new Vector3(), look: new Vector3(), fov: 40, shift: 0 }
  private departBoost = 0
  private readonly tmpRight = new Vector3()

  private readonly resizeObserver: ResizeObserver
  private reducedMotion: boolean

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly opts: WorldOptions,
  ) {
    this.reducedMotion = opts.reducedMotion
    this.renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'default', alpha: false })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    // Shader validation is a dev aid; in production it only costs time (and logs driver noise).
    this.renderer.debug.checkShaderErrors = import.meta.env.DEV
    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    this.renderer.setPixelRatio(this.dpr)

    this.path = buildRoute()
    this.director = new CameraDirector(this.path, stopDistances(this.path))

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas.parentElement ?? canvas)
  }

  async init() {
    await loadFonts()
    // The host may have torn us down while fonts were loading.
    if (this.disposed) return
    const { scene, renderer } = this
    scene.background = HORIZON.clone()
    scene.fog = new FogExp2(HORIZON.clone(), 0.0155)

    this.env = buildEnvironment(renderer)
    scene.environment = this.env
    scene.environmentIntensity = 0.5

    // Neutral moonlight key, a soft cool fill and a restrained warm rim — keeps the pearl paint pearl.
    scene.add(new HemisphereLight('#b9c6de', '#0a0d14', 0.42))
    const moon = new DirectionalLight('#eef2ff', 1.55)
    moon.position.set(-60, 110, 40)
    const rim = new DirectionalLight('#ffc89c', 0.32)
    rim.position.set(80, 30, -70)
    scene.add(moon, rim, moon.target, rim.target)

    const sky = buildSky(1500, this.dpr)
    this.sky = sky
    scene.add(sky.group)

    const stopD = this.director.stopD
    const colorAt = this.districtColour(stopD)
    scene.add(buildTrack(this.path, colorAt).group)
    scene.add(buildTunnel(this.path, this.path.at('tunnelIn'), this.path.at('tunnelOut')))

    const pools = stations
      .filter((s) => s.id !== 'landing')
      .map((s) => {
        const d = stopD[stops.findIndex((x) => x.station === s.id)] - TRAIN.length / 2
        const p = this.path.point(d)
        return { x: p.x, z: p.z, radius: s.id === 'career' ? 30 : 22, color: new Color(s.color) }
      })
    scene.add(buildGround(this.routeCentre(), pools))

    this.buildStations(stopD)
    scene.add(this.train.group)

    this.resize()
    this.update(0, true)
    this.renderer.compile(scene, this.camera)
  }

  private buildStations(stopD: number[]) {
    const ctxFor = (id: StationId): StationContext => {
      const stop = stops.findIndex((s) => s.station === id)
      return {
        kit: this.kit,
        path: this.path,
        stopD: stopD[stop],
        trainLength: TRAIN.length,
        color: new Color(stations.find((s) => s.id === id)!.color),
        eye: this.director.stationShotFor(stop).eye,
      }
    }
    this.depot = buildDepot(ctxFor('landing'))
    this.aiLab = buildAiLab(ctxFor('ai-lab'))
    const careerStops = stops.map((s, i) => (s.station === 'career' ? stopD[i] : null)).filter((d): d is number => d !== null)
    this.stationBuilds.set('landing', this.depot)
    this.stationBuilds.set('profile', buildCentral(ctxFor('profile')))
    this.stationBuilds.set('design', buildDesign(ctxFor('design')))
    this.stationBuilds.set('engineering', buildEngineering(ctxFor('engineering')))
    this.stationBuilds.set('projects', buildProjects(ctxFor('projects')))
    this.stationBuilds.set(
      'career',
      buildCareer({ ...ctxFor('career'), milestones: careerStops, nowD: this.path.at('careerNow'), startD: this.path.at('careerStart') }),
    )
    this.stationBuilds.set('ai-lab', this.aiLab)
    this.stationBuilds.set('contact', buildFinal({ ...ctxFor('contact'), bufferD: this.path.at('bufferEnd') }))

    this.stationBuilds.forEach((b, id) => {
      this.scene.add(b.group)
      if (b.hoverables) this.hoverables.push(...b.hoverables)
      const stop = stops.findIndex((s) => s.station === id)
      const d = id === 'career' ? (this.path.at('careerStart') + this.path.at('careerNow')) / 2 : stopD[stop]
      this.stationCentres.set(id, this.path.point(d))
    })

    // The city fills in around everything, keeping set pieces and camera sight lines clear.
    const zone = (id: StationId, along: number, side: number, r: number) => {
      const stop = stops.findIndex((s) => s.station === id)
      const d = stopD[stop] - TRAIN.length / 2
      const p = this.path.point(d)
      const t = this.path.tangent(d)
      const rv = TrackPath.right(t)
      return { x: p.x + t.x * along + rv.x * side, z: p.z + t.z * along + rv.z * side, r }
    }
    const zones = [
      zone('landing', -1, 6, 11),
      zone('profile', 0, 0, 13),
      zone('profile', -4.5, 9.5, 5),
      zone('design', 0, -9, 14),
      zone('engineering', 0, 9, 14),
      zone('projects', 0, 9.5, 14),
      zone('ai-lab', -0.5, -11, 9.5),
      zone('contact', -2, 6, 10),
      zone('contact', 11, 4, 10),
    ]
    const keepOut = stops.map((_, i) => {
      const shot = this.director.stationShotFor(i)
      return { a: shot.eye.clone(), b: shot.look.clone(), r: 3.2 }
    })
    // Nothing tall right in front of any station camera either.
    stops.forEach((_, i) => {
      const { eye } = this.director.stationShotFor(i)
      zones.push({ x: eye.x, z: eye.z, r: 10 })
    })
    const tints = stations.map((s) => {
      const z = zone(s.id, 0, 0, 0)
      return { x: z.x, z: z.z, color: new Color(s.color) }
    })
    this.city = buildCity(this.path, zones, keepOut, tints)
    this.scene.add(this.city.group)
  }

  /** The AI Lab's core reacts to the assistant on the page. */
  aiThink() {
    this.aiLab?.think()
    this.needsRender = true
  }

  aiAnswer() {
    this.aiLab?.answer()
    this.needsRender = true
  }

  /** Edge-light colour along the line: each district's colour near its station, a cool dim blue between. */
  private districtColour(stopD: number[]) {
    const base = new Color('#2f4a78').multiplyScalar(0.55)
    const entries = stops
      .map((s, i) => ({ d: stopD[i] - TRAIN.length / 2, c: new Color(stations.find((x) => x.id === s.station)!.color) }))
      .filter((_, i) => stops[i].milestone === undefined || stops[i].milestone === 0)
    const out = new Color()
    return (d: number) => {
      out.copy(base)
      for (const e of entries) {
        const k = MathUtils.clamp(1 - Math.abs(d - e.d) / 26, 0, 1)
        if (k > 0) out.lerp(e.c.clone().multiplyScalar(0.85), k * k * (3 - 2 * k))
      }
      return out
    }
  }

  private routeCentre(): Vector3 {
    const c = new Vector3()
    const p = new Vector3()
    const n = 40
    for (let i = 0; i <= n; i++) c.add(this.path.point((this.path.length * i) / n, p))
    return c.multiplyScalar(1 / (n + 1))
  }

  // ------------------------------------------------------------ loop

  start() {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    document.addEventListener('visibilitychange', this.onVisibility)
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('pointerleave', this.onPointerLeave)
    window.addEventListener('click', this.onClick)
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
    document.removeEventListener('visibilitychange', this.onVisibility)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerleave', this.onPointerLeave)
    window.removeEventListener('click', this.onClick)
  }

  invalidate() {
    this.needsRender = true
  }

  private onVisibility = () => {
    // rAF already pauses in hidden tabs; reset the clock so we don't jump on return.
    this.lastTime = performance.now()
    this.needsRender = true
  }

  private frame = (now: number) => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)
    const dt = Math.min(0.1, (now - this.lastTime) / 1000)
    this.lastTime = now

    const j = this.opts.journey()
    const moving = Math.abs(j - this.lastJ) > 1e-5
    const animating = moving || this.focusWeight !== this.focusTarget || this.departBoost > 0.001
    const pointerSettling = !this.reducedMotion && this.pointerDamped.distanceToSquared(this.pointer) > 1e-6
    this.idleFor = animating || pointerSettling ? 0 : this.idleFor + dt

    // Idle scenes still breathe (stars, holograms) but at a lower frame rate; with reduced motion they sleep.
    let due: boolean
    if (this.needsRender || animating || pointerSettling) due = true
    else if (this.reducedMotion) due = false
    else due = now - this.lastRender >= (this.idleFor > 1.5 ? 1000 / 30 : 0)
    if (!due) return

    this.update(dt, false)
    const t0 = performance.now()
    this.renderer.render(this.scene, this.camera)
    this.trackPerformance(performance.now() - t0, dt)
    this.lastRender = now
    this.lastJ = j
    this.needsRender = false
  }

  private update(dt: number, first: boolean) {
    const time = (performance.now() - this.clockStart) / 1000
    const j = this.opts.journey()
    const state: FrameState = { time, dt, j, reducedMotion: this.reducedMotion }

    // Train
    const front = this.director.trainFront(j)
    this.train.update(this.path, front)
    this.departBoost = Math.max(0, this.departBoost - dt * 0.5)
    this.train.setLampBoost(this.departBoost)

    // Camera
    const shot = this.director.shotAt(j)
    const s = this.finalShot
    s.eye.copy(shot.eye)
    s.look.copy(shot.look)
    s.fov = shot.fov
    s.shift = shot.shift

    // Station idle drift + pointer parallax, faded out while travelling.
    const still = 1 - this.director.transitWeight
    if (!this.reducedMotion) {
      const k = 1 - Math.exp(-3 * (first ? 10 : dt))
      this.pointerDamped.lerp(this.pointer, k)
      const drift = Math.sin(time * 0.13) * 0.35
      const bob = Math.sin(time * 0.1 + 1.3) * 0.18
      const right = this.tmpRight.subVectors(s.look, s.eye).cross(UP).normalize()
      s.eye.addScaledVector(right, (this.pointerDamped.x * 0.9 + drift) * still)
      s.eye.y += (this.pointerDamped.y * 0.45 + bob) * still
    }

    // Focus blend (project zoom).
    const fk = this.reducedMotion ? 1 : 1 - Math.exp(-4 * dt)
    this.focusWeight += (this.focusTarget - this.focusWeight) * (first ? 1 : fk)
    if (Math.abs(this.focusTarget - this.focusWeight) < 1e-3) this.focusWeight = this.focusTarget
    if (this.focusShot && this.focusWeight > 0) {
      const w = this.focusWeight * this.focusWeight * (3 - 2 * this.focusWeight)
      s.eye.lerp(this.focusShot.eye, w)
      s.look.lerp(this.focusShot.look, w)
      s.shift *= 1 - w
    }

    CameraDirector.apply(this.camera, s, this.width, this.height)
    this.sky?.group.position.copy(this.camera.position)
    this.sky?.update(this.reducedMotion ? 0 : time)

    // Stations beyond the fog are invisible anyway — skip drawing and updating them.
    this.stationBuilds.forEach((b, id) => {
      const c = this.stationCentres.get(id)
      const near = !c || c.distanceTo(this.camera.position) < 130
      b.group.visible = near
      if (near) b.update?.(state)
    })
    this.updateHover()
  }

  private trackPerformance(renderMs: number, dt: number) {
    // Adaptive resolution: if frames are consistently slow, render fewer pixels.
    if (dt <= 0 || dt > 0.09) return
    this.frameTimes.push(dt)
    if (this.frameTimes.length < 90) return
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    this.frameTimes.length = 0
    if (avg > 1 / 42 && this.dpr > 1) {
      this.dprCap = Math.max(1, this.dpr - 0.25)
      this.resize()
    }
    void renderMs
  }

  // ------------------------------------------------------------ interaction

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1))
    this.pointerClient = { x: e.clientX, y: e.clientY }
    const el = e.target as Element | null
    this.pointerOverUi = !!el?.closest?.('.station__panel, .ui, button, a, input, textarea, header, nav, [role="dialog"]')
    this.needsRender = true
  }

  private onPointerLeave = () => {
    this.pointer.set(0, 0)
    this.pointerClient = null
  }

  private onClick = (e: MouseEvent) => {
    const el = e.target as Element | null
    if (el?.closest?.('.station__panel, .ui, button, a, input, textarea, header, nav, [role="dialog"]')) return
    if (this.hovered) this.opts.onSelect?.({ kind: this.hovered.kind, id: this.hovered.id })
  }

  private updateHover() {
    let hit: Hoverable | null = null
    if (this.pointerClient && !this.pointerOverUi && this.director.transitWeight < 0.15 && this.focusTarget === 0) {
      this.raycaster.setFromCamera(this.pointer, this.camera)
      let best = Infinity
      for (const h of this.hoverables) {
        if (!isShown(h.targets[0])) continue
        const hits = this.raycaster.intersectObjects(h.targets, false)
        if (hits.length && hits[0].distance < best) {
          best = hits[0].distance
          hit = h
        }
      }
    }
    if (hit !== this.hovered) {
      this.hovered?.setActive(false)
      hit?.setActive(true)
      this.hovered = hit
      document.documentElement.classList.toggle('world-hover', !!hit)
      this.opts.onHover?.(hit ? { kind: hit.kind, id: hit.id } : null)
      this.needsRender = true
    }
  }

  /** Highlight from the page side (hovering a tech chip, for example). */
  highlight(kind: Hoverable['kind'], id: string | null) {
    for (const h of this.hoverables) {
      if (h.kind === kind) h.setActive(h.id === id || h === this.hovered)
    }
    this.needsRender = true
  }

  focus(station: StationId, id: string | null) {
    const b = this.stationBuilds.get(station)
    const shot = id ? b?.focus?.(id) : null
    if (shot) {
      this.focusShot = shot
      this.focusTarget = 1
    } else {
      this.focusTarget = 0
    }
    this.needsRender = true
  }

  depart() {
    this.depot?.setSignal(true)
    this.departBoost = 1
    this.needsRender = true
    window.setTimeout(() => this.depot?.setSignal(false), 6000)
  }

  setReducedMotion(v: boolean) {
    this.reducedMotion = v
    this.needsRender = true
  }

  resize() {
    const el = this.canvas.parentElement ?? this.canvas
    const w = Math.max(1, el.clientWidth)
    const h = Math.max(1, el.clientHeight)
    this.width = w
    this.height = h
    // Re-read the pixel ratio: browser zoom or a move to another monitor changes it.
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap)
    if (dpr !== this.dpr) {
      this.dpr = dpr
      this.renderer.setPixelRatio(dpr)
    }
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.needsRender = true
  }

  /** Safe to call at any point, including while init() is still awaiting fonts. */
  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.stop()
    this.resizeObserver.disconnect()
    this.stationBuilds.forEach((b) => b.dispose?.())
    this.city?.dispose()
    this.train.dispose()
    this.sky?.dispose()
    this.kit.dispose()
    this.env?.dispose()
    this.scene.traverse((o) => {
      const mesh = o as unknown as { geometry?: { dispose(): void } }
      mesh.geometry?.dispose()
    })
    this.renderer.dispose()
    // Hand the context back now rather than waiting for GC (browsers cap live contexts).
    this.renderer.forceContextLoss()
    document.documentElement.classList.remove('world-hover')
  }
}

/** Raycasting ignores visibility, so check the ancestor chain ourselves. */
function isShown(obj: { visible: boolean; parent: unknown } | undefined): boolean {
  let o = obj as { visible: boolean; parent: unknown } | null | undefined
  while (o) {
    if (!o.visible) return false
    o = o.parent as typeof o
  }
  return true
}

async function loadFonts() {
  if (!document.fonts) return
  const faces = ['expanded 800 64px "Archivo"', 'expanded 700 64px "Archivo"', '500 32px "Geist Mono"', '400 32px "Geist"']
  await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 1500))]).catch(() => {})
}
