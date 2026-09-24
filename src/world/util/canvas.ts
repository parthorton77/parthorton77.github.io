import { CanvasTexture, LinearMipmapLinearFilter, SRGBColorSpace } from 'three'

/**
 * Procedural textures: every sign, screen and glow in the world is drawn at runtime,
 * so the site ships zero image assets for the 3D scene.
 */

export const FONT_DISPLAY = '"Archivo", "Arial Black", sans-serif'
export const FONT_MONO = '"Geist Mono", ui-monospace, monospace'
export const FONT_SANS = '"Geist", system-ui, sans-serif'

type Ctx = CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string }

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d') as Ctx]
}

export function toTexture(canvas: HTMLCanvasElement, anisotropy = 4): CanvasTexture {
  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = anisotropy
  t.minFilter = LinearMipmapLinearFilter
  t.generateMipmaps = true
  return t
}

/** Wide display type (Archivo at 125% width where the browser supports canvas font-stretch). */
export function displayFont(ctx: Ctx, weight: number, px: number) {
  ctx.font = `expanded ${weight} ${px}px ${FONT_DISPLAY}`
  if ('fontStretch' in ctx) ctx.fontStretch = 'expanded'
}

export function monoFont(ctx: Ctx, weight: number, px: number, spacing = 0) {
  ctx.font = `${weight} ${px}px ${FONT_MONO}`
  if ('fontStretch' in ctx) ctx.fontStretch = 'normal'
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`
}

export function fitText(ctx: Ctx, text: string, maxWidth: number, set: (px: number) => void, startPx: number) {
  let px = startPx
  set(px)
  while (ctx.measureText(text).width > maxWidth && px > 8) {
    px -= 2
    set(px)
  }
  return px
}

export function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Soft radial glow used for additive light sprites. */
export function glowTexture(size = 128, inner = 'rgba(255,255,255,1)'): CanvasTexture {
  const [c, ctx] = makeCanvas(size, size)
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, inner)
  g.addColorStop(0.18, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.14)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return toTexture(c, 1)
}

/** Vertical light-cone gradient (bright at the base, fading upward). */
export function beamTexture(): CanvasTexture {
  const [c, ctx] = makeCanvas(8, 128)
  const g = ctx.createLinearGradient(0, 128, 0, 0)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.28)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 8, 128)
  return toTexture(c, 1)
}

export interface SignSpec {
  title: string
  kicker?: string
  code?: string
  color: string
  width?: number
  height?: number
}

/** Station name board: dark enamel, district colour strip, wide white lettering. */
export function stationSignTexture({ title, kicker, code, color, width = 1024, height = 200 }: SignSpec): CanvasTexture {
  const [c, ctx] = makeCanvas(width, height)
  ctx.fillStyle = '#0b1019'
  rrect(ctx, 0, 0, width, height, 22)
  ctx.fill()
  ctx.strokeStyle = 'rgba(160,180,210,0.22)'
  ctx.lineWidth = 3
  rrect(ctx, 2, 2, width - 4, height - 4, 20)
  ctx.stroke()

  const pad = height * 0.2
  // Colour strip + code badge.
  ctx.fillStyle = color
  rrect(ctx, pad, pad, height - pad * 2, height - pad * 2, 16)
  ctx.fill()
  if (code) {
    ctx.fillStyle = '#0b1019'
    // Mono so a zero never reads as the letter O.
    monoFont(ctx, 600, height * 0.27)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(code, height / 2, height / 2 + 2)
  }

  const x = height + pad * 0.3
  const maxW = width - x - pad
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#eef2f8'
  fitText(ctx, title.toUpperCase(), maxW, (px) => displayFont(ctx, 800, px), height * 0.34)
  ctx.fillText(title.toUpperCase(), x, height * (kicker ? 0.56 : 0.64))
  if (kicker) {
    monoFont(ctx, 500, height * 0.13, 4)
    ctx.fillStyle = 'rgba(170,180,198,0.95)'
    ctx.fillText(kicker.toUpperCase(), x, height * 0.8)
  }
  return toTexture(c)
}

/** Compact label plate (tech towers, gantries, plaques). */
export function labelTexture(
  text: string,
  { color = '#eef2f8', bg = 'rgba(8,12,20,0.92)', border = 'rgba(160,180,210,0.28)', width = 512, height = 128, mono = true, sub = '' } = {},
): CanvasTexture {
  const [c, ctx] = makeCanvas(width, height)
  ctx.fillStyle = bg
  rrect(ctx, 0, 0, width, height, height * 0.2)
  ctx.fill()
  ctx.strokeStyle = border
  ctx.lineWidth = 4
  rrect(ctx, 2, 2, width - 4, height - 4, height * 0.18)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const set = (px: number) => (mono ? monoFont(ctx, 500, px, px * 0.06) : displayFont(ctx, 800, px))
  fitText(ctx, text, width * 0.86, set, height * (sub ? 0.36 : 0.44))
  ctx.fillText(text, width / 2, height * (sub ? 0.4 : 0.52))
  if (sub) {
    monoFont(ctx, 500, height * 0.16, 3)
    ctx.fillStyle = 'rgba(170,180,198,0.9)'
    ctx.fillText(sub.toUpperCase(), width / 2, height * 0.74)
  }
  return toTexture(c)
}
