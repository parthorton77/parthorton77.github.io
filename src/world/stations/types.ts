import type { Color, Group, Object3D, Vector3 } from 'three'
import type { Kit } from './kit'
import type { TrackPath } from '../track/TrackPath'

export interface StationContext {
  kit: Kit
  path: TrackPath
  /** Track distance of the train's nose when docked here. */
  stopD: number
  trainLength: number
  color: Color
  /** Where this station's camera sits, so set pieces can turn toward it. */
  eye: Vector3
}

/** Something under the pointer in 3D that maps back to page content. */
export interface Hoverable {
  kind: 'tech' | 'project'
  id: string
  /** Meshes the raycaster tests. */
  targets: Object3D[]
  setActive(on: boolean): void
}

export interface FrameState {
  time: number
  dt: number
  /** Journey value (continuous stop index). */
  j: number
  reducedMotion: boolean
}

export interface StationBuild {
  group: Group
  update?(state: FrameState): void
  hoverables?: Hoverable[]
  /** World position to fly the camera toward for a focused item. */
  focus?(id: string): { eye: Vector3; look: Vector3 } | null
  dispose?(): void
}
