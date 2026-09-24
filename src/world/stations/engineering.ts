import { AdditiveBlending, BoxGeometry, Color, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from 'three'
import { Anchor, mergeMeshes, platform } from './kit'
import type { Hoverable, StationBuild, StationContext } from './types'
import { labelTexture, makeCanvas, monoFont, rrect, stationSignTexture, toTexture } from '../util/canvas'
import { skillGroups } from '@/data/portfolio'

const CYAN = '#6fd0ff'

/** Engineering Station — every technology on the résumé stands as a tower with a holographic sign. */
export function buildEngineering(ctx: StationContext): StationBuild {
  const { kit, path, stopD, trainLength } = ctx
  const group = new Group()
  group.name = 'engineering'
  const a = new Anchor(path, stopD - trainLength / 2)

  group.add(platform(kit, a, 0, { side: 1, length: 15, edge: CYAN }))
  const sign = kit.sign(stationSignTexture({ title: 'Engineering Station', kicker: 'Platform 03 · Frontend', code: 'ES', color: CYAN }), 3.9, 0.76)
  a.place(sign, 4.2, 2.1, 2.55)
  const post = new Mesh(new BoxGeometry(0.08, 2, 0.08), kit.metal)
  a.place(post, 4.2, 2.1, 1.62)
  group.add(sign, post)

  const techs = skillGroups.filter((g) => g.id !== 'design').flatMap((g) => g.items.map((name) => ({ name, group: g.title })))
  // Frameworks are the landmarks — tallest, centre of the back row.
  const heights: Record<string, number> = { 'Vue.js': 8.6, React: 7.6, TypeScript: 6.6, JavaScript: 6.2 }
  const hoverables: Hoverable[] = []
  const towerMat = new MeshStandardMaterial({ color: '#1a2230', roughness: 0.4, metalness: 0.75 })
  kit.own(towerMat)

  const front = techs.filter((t) => t.group !== 'Frameworks')
  const back = techs.filter((t) => t.group === 'Frameworks')
  // Staggered rows; heights step up row by row so every sign stays visible from the platform camera.
  const slots: { t: (typeof techs)[number]; along: number; side: number; lift: number }[] = []
  front.forEach((t, i) => {
    const row = i % 2
    const col = Math.floor(i / 2)
    slots.push({ t, along: -11 + col * 3.6 + row * 1.8, side: 6.6 + row * 3.6, lift: row * 1.4 })
  })
  back.forEach((t, i) => slots.push({ t, along: -2.2 + i * 4.8, side: 14.4, lift: 0 }))

  let seed = 11
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  for (const { t, along, side, lift } of slots) {
    const h = heights[t.name] ?? 2.4 + lift + rand() * 1.6
    const tower = new Group()
    const body = new Mesh(new BoxGeometry(1.15, h, 1.15), towerMat)
    body.position.y = h / 2
    tower.add(body)

    // Edge strips + floor bands, merged into a single mesh per tower (one draw call).
    const edgeMat = new MeshBasicMaterial({ color: new Color(CYAN).multiplyScalar(0.45), toneMapped: false })
    kit.own(edgeMat)
    const lines: Mesh[] = []
    for (const [x, z] of [
      [-0.58, -0.58],
      [0.58, -0.58],
    ]) {
      const e = new Mesh(new BoxGeometry(0.035, h, 0.035))
      e.position.set(x, h / 2, z)
      lines.push(e)
    }
    for (let y = 1; y < h - 0.4; y += 1.1) {
      const band = new Mesh(new BoxGeometry(1.17, 0.03, 1.17))
      band.position.y = y
      lines.push(band)
    }
    tower.add(new Mesh(mergeMeshes(lines), edgeMat))
    lines.forEach((m) => m.geometry.dispose())

    const labelMat = new MeshBasicMaterial({
      map: labelTexture(t.name, { color: '#eaf6ff', sub: t.group, border: 'rgba(111,208,255,0.6)', width: 512, height: 160 }),
      transparent: true,
      toneMapped: false,
      opacity: 0.92,
    })
    kit.own(labelMat)
    const label = new Mesh(new PlaneGeometry(2.1, 0.66), labelMat)
    label.position.set(0, h + 0.62, 0)
    label.rotation.y = Math.PI
    tower.add(label)

    const beamMat = new MeshBasicMaterial({
      map: kit.beam,
      color: new Color(CYAN),
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    kit.own(beamMat)
    const beam = new Mesh(new CylinderGeometry(0.5, 0.62, 5, 16, 1, true), beamMat)
    beam.position.y = h + 3.1
    tower.add(beam)

    a.place(tower, along, side, 0)
    group.add(tower)

    const base = label.position.y
    hoverables.push({
      kind: 'tech',
      id: t.name,
      targets: [body, label],
      setActive(on) {
        edgeMat.color.set(CYAN).multiplyScalar(on ? 1.4 : 0.45)
        beamMat.opacity = on ? 0.55 : 0
        label.scale.setScalar(on ? 1.18 : 1)
        label.position.y = base + (on ? 0.25 : 0)
        labelMat.opacity = on ? 1 : 0.92
      },
    })
  }

  // Floating code panels near the platform.
  // Decorative, version-neutral snippets in listed tech (Vue.js template, SCSS).
  const snippets = [
    ['<template>', '  <StationSign :station="station" />', '  <PlatformBoard :lines="lines" />', '</template>'],
    ['.panel {', '  display: grid;', '  gap: clamp(12px, 2vw, 24px);', '  @include up(md) { … }', '}'],
  ]
  const codePanels: Mesh[] = []
  snippets.forEach((lines, i) => {
    const mesh = new Mesh(new PlaneGeometry(3.0, 1.5), kit.holo(codeTexture(lines), '#ffffff', 0.9))
    a.at(-14 + i * 27, 4.5, 6.2 + i * 0.4, mesh.position)
    mesh.rotation.y = a.yaw + Math.PI + (i === 0 ? -0.35 : 0.35)
    group.add(mesh)
    codePanels.push(mesh)
  })

  // Circuit traces on the ground from the platform to the towers (merged: one draw call).
  const traces: Mesh[] = []
  for (let i = 0; i < 9; i++) {
    const along = -9 + i * 2.2
    const len = 3 + (i % 3) * 2.4
    const tr = new Mesh(new BoxGeometry(0.06, 0.012, len))
    a.place(tr, along, 5.2 + len / 2, 0.01)
    const dot = new Mesh(new BoxGeometry(0.18, 0.014, 0.18))
    a.place(dot, along, 5.2 + len, 0.012)
    traces.push(tr, dot)
  }
  group.add(new Mesh(mergeMeshes(traces), kit.light(CYAN, 0.35)))
  traces.forEach((m) => m.geometry.dispose())

  return {
    group,
    hoverables,
    update({ time, reducedMotion }) {
      if (reducedMotion) return
      codePanels.forEach((m, i) => (m.position.y = a.p.y + 6.2 + i * 0.4 + Math.sin(time * 0.6 + i * 2) * 0.1))
    },
  }
}

function codeTexture(lines: string[]) {
  const [c, ctx] = makeCanvas(768, 384)
  ctx.fillStyle = 'rgba(8,16,26,0.8)'
  rrect(ctx, 4, 4, 760, 376, 22)
  ctx.fill()
  ctx.strokeStyle = 'rgba(111,208,255,0.7)'
  ctx.lineWidth = 3
  rrect(ctx, 4, 4, 760, 376, 22)
  ctx.stroke()
  ;['#ff6b6b', '#ffb547', '#6ee7a0'].forEach((col, i) => {
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(34 + i * 26, 34, 8, 0, Math.PI * 2)
    ctx.fill()
  })
  monoFont(ctx, 500, 28)
  lines.forEach((line, i) => {
    ctx.fillStyle = 'rgba(111,208,255,0.5)'
    ctx.fillText(String(i + 1).padStart(2, ' '), 26, 96 + i * 52)
    ctx.fillStyle = i === 0 || i === lines.length - 1 ? '#a993ff' : '#eaf6ff'
    ctx.fillText(line, 76, 96 + i * 52)
  })
  return toTexture(c)
}
