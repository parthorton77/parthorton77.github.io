import { experiences } from './experience'
import { skillGroups } from './skills'

/** Derived once from the experience data so no copy can drift at the turn of a year. */
export const openedYear = Number(experiences[0]?.year.slice(0, 4)) || new Date().getFullYear()
export const yearsRunning = Math.max(1, new Date().getFullYear() - openedYear)
export const stationCount = experiences.length
export const skillCount = skillGroups.reduce((total, group) => total + group.items.length, 0)
