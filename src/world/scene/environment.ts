import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
  UniformsLib,
  UniformsUtils,
  Vector3,
  WebGLRenderer,
} from 'three'
import { makeCanvas, toTexture } from '../util/canvas'

export const HORIZON = new Color('#0a0f19')
export const ZENITH = new Color('#020308')

// ---------------------------------------------------------------- Sky

export interface Sky {
  group: Group
  update(time: number): void
  dispose(): void
}

export function buildSky(starCount: number, pixelRatio: number): Sky {
  const group = new Group()
  group.name = 'sky'

  const dome = new Mesh(
    new SphereGeometry(900, 48, 24),
    new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        horizon: { value: HORIZON },
        zenith: { value: ZENITH },
        warm: { value: new Color('#ff9a52') },
        warmDir: { value: new Vector3(0.55, 0.08, 0.83).normalize() },
        cool: { value: new Color('#3f6cff') },
        coolDir: { value: new Vector3(-0.8, 0.1, -0.6).normalize() },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 horizon; uniform vec3 zenith;
        uniform vec3 warm; uniform vec3 warmDir;
        uniform vec3 cool; uniform vec3 coolDir;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.5, h));
          // City glow low on the horizon, a colder haze opposite.
          float low = smoothstep(0.32, 0.0, abs(h));
          col += warm * pow(max(dot(d, warmDir), 0.0), 6.0) * low * 0.055;
          col += cool * pow(max(dot(d, coolDir), 0.0), 4.0) * low * 0.06;
          col = mix(horizon, col, smoothstep(-0.04, 0.01, h));
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  )
  dome.renderOrder = -10
  group.add(dome)

  // Stars — a single draw call with a per-star twinkle phase.
  const pos: number[] = []
  const size: number[] = []
  const phase: number[] = []
  const col: number[] = []
  const tints = [new Color('#ffffff'), new Color('#cfe0ff'), new Color('#ffe7c4'), new Color('#b9c9ff')]
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  for (let i = 0; i < starCount; i++) {
    const u = rand()
    const v = rand()
    const theta = u * Math.PI * 2
    const y = 0.02 + Math.pow(v, 0.8) * 0.98
    const r = Math.sqrt(1 - y * y)
    pos.push(Math.cos(theta) * r * 780, y * 780, Math.sin(theta) * r * 780)
    const big = rand() > 0.965
    size.push(big ? 2.2 + rand() * 1.4 : 0.9 + rand() * 1.1)
    phase.push(rand())
    const c = tints[Math.floor(rand() * tints.length)]
    col.push(c.r, c.g, c.b)
  }
  const starGeo = new BufferGeometry()
  starGeo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  starGeo.setAttribute('size', new Float32BufferAttribute(size, 1))
  starGeo.setAttribute('phase', new Float32BufferAttribute(phase, 1))
  starGeo.setAttribute('color', new Float32BufferAttribute(col, 3))
  const starMat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexColors: true,
    fog: false,
    uniforms: { time: { value: 0 }, pixelRatio: { value: pixelRatio } },
    vertexShader: /* glsl */ `
      attribute float size; attribute float phase;
      uniform float time; uniform float pixelRatio;
      varying float vAlpha; varying vec3 vColor;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float tw = 0.72 + 0.28 * sin(time * (0.5 + phase * 1.3) + phase * 40.0);
        gl_PointSize = size * pixelRatio;
        vAlpha = tw * smoothstep(0.0, 0.18, normalize(position).y);
        vColor = color;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha; varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d);
        gl_FragColor = vec4(vColor, a * vAlpha * 0.9);
      }`,
  })
  const stars = new Points(starGeo, starMat)
  stars.renderOrder = -9
  group.add(stars)

  // A distant planet on the horizon — rim-lit, mostly in shadow.
  const planetDir = new Vector3(-0.62, 0.16, 0.77).normalize()
  const planet = new Mesh(
    new SphereGeometry(120, 64, 32),
    new ShaderMaterial({
      fog: false,
      depthWrite: false,
      uniforms: {
        lightDir: { value: new Vector3(0.9, 0.35, -0.2).normalize() },
        rim: { value: new Color('#7fa8ff') },
        base: { value: new Color('#070a12') },
      },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV; varying vec3 vWN;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vWN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 lightDir; uniform vec3 rim; uniform vec3 base;
        varying vec3 vN; varying vec3 vV; varying vec3 vWN;
        void main() {
          float lit = max(dot(normalize(vWN), lightDir), 0.0);
          float fres = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.6);
          vec3 col = base + rim * (lit * 0.16 + fres * lit * 1.4 + fres * 0.05);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  )
  planet.position.copy(planetDir).multiplyScalar(720)
  planet.renderOrder = -8
  group.add(planet)

  // Two faint nebula veils.
  const nebula = nebulaTexture()
  for (const [dir, color, scale, opacity] of [
    [new Vector3(0.3, 0.42, -0.85), '#5e5bff', 620, 0.22],
    [new Vector3(0.85, 0.3, 0.45), '#ff7ab8', 480, 0.12],
  ] as const) {
    const s = new Sprite(
      new SpriteMaterial({
        map: nebula,
        color: new Color(color),
        transparent: true,
        opacity,
        blending: AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    )
    s.position.copy(dir).normalize().multiplyScalar(760)
    s.scale.set(scale, scale * 0.55, 1)
    s.renderOrder = -9
    group.add(s)
  }

  return {
    group,
    update(time: number) {
      starMat.uniforms.time.value = time
    },
    dispose() {
      group.traverse((o) => {
        if (o instanceof Mesh || o instanceof Points) {
          o.geometry.dispose()
          ;(o.material as ShaderMaterial).dispose()
        }
      })
      nebula.dispose()
    },
  }
}

function nebulaTexture(): Texture {
  const [c, ctx] = makeCanvas(256, 256)
  let seed = 3
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  for (let i = 0; i < 26; i++) {
    const x = 60 + rand() * 136
    const y = 70 + rand() * 116
    const r = 30 + rand() * 70
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(255,255,255,${0.06 + rand() * 0.08})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
  }
  return toTexture(c, 1)
}

// ---------------------------------------------------------------- Ground

export interface LightPool {
  x: number
  z: number
  radius: number
  color: Color
}

export function buildGround(centre: Vector3, pools: LightPool[]): Mesh {
  const MAX = 12
  const poolData = Array.from({ length: MAX }, (_, i) => pools[i])
  const mat = new ShaderMaterial({
    fog: true,
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        base: { value: new Color('#070a11') },
        minor: { value: new Color('#1b2536') },
        major: { value: new Color('#2a3a55') },
        poolPos: { value: poolData.map((p) => new Vector3(p?.x ?? 1e5, p?.radius ?? 1, p?.z ?? 1e5)) },
        poolColor: { value: poolData.map((p) => p?.color ?? new Color(0, 0, 0)) },
      },
    ]),
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 base; uniform vec3 minor; uniform vec3 major;
      uniform vec3 poolPos[${MAX}]; uniform vec3 poolColor[${MAX}];
      varying vec3 vWorld;
      #include <fog_pars_fragment>
      float gridLine(vec2 p, float cell) {
        vec2 q = p / cell;
        vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
        return 1.0 - min(min(g.x, g.y), 1.0);
      }
      void main() {
        vec2 p = vWorld.xz;
        vec3 col = base;
        col = mix(col, minor, gridLine(p, 3.0) * 0.55);
        col = mix(col, major, gridLine(p, 24.0) * 0.8);
        for (int i = 0; i < ${MAX}; i++) {
          float d = distance(p, poolPos[i].xz);
          float k = smoothstep(poolPos[i].y, 0.0, d);
          col += poolColor[i] * k * k * 0.028;
        }
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  })
  const ground = new Mesh(new PlaneGeometry(2600, 2600), mat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(centre.x, -0.01, centre.z)
  ground.name = 'ground'
  return ground
}

// ---------------------------------------------------------------- Environment map

/** A tiny, dark "studio" rendered once into a PMREM so paint and metal get real highlights. */
export function buildEnvironment(renderer: WebGLRenderer): Texture {
  const env = new Scene()
  env.add(
    new Mesh(
      new SphereGeometry(50, 32, 16),
      new ShaderMaterial({
        side: BackSide,
        uniforms: {},
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = mix(vec3(0.012,0.015,0.024), vec3(0.09,0.11,0.16), smoothstep(-0.2, 0.9, h)); gl_FragColor = vec4(c, 1.0); }`,
      }),
    ),
  )
  const softbox = (w: number, h: number, color: string, intensity: number, p: [number, number, number]) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: 2 }))
    m.position.set(...p)
    m.lookAt(0, 0, 0)
    env.add(m)
  }
  softbox(40, 6, '#bcd2ff', 1.6, [0, 30, -10])
  softbox(30, 4, '#ffd2a1', 1.2, [30, 8, 20])
  softbox(16, 16, '#8fb1ff', 0.7, [-35, 12, -6])
  const pmrem = new PMREMGenerator(renderer)
  const tex = pmrem.fromScene(env, 0.035).texture
  pmrem.dispose()
  env.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose()
      o.material.dispose()
    }
  })
  return tex
}
