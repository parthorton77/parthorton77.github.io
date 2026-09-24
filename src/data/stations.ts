import { roles } from './portfolio'

export type StationId =
  | 'landing'
  | 'profile'
  | 'design'
  | 'engineering'
  | 'projects'
  | 'career'
  | 'ai-lab'
  | 'contact'

export type StationIcon =
  | 'depot'
  | 'central'
  | 'design'
  | 'engineering'
  | 'projects'
  | 'career'
  | 'ai'
  | 'contact'

export interface Station {
  id: StationId
  /** Station name as it appears on signage. */
  name: string
  /** Metro-map label. */
  nav: string
  platform: string
  code: string
  /** District colour — shared by the CSS layer and the 3D world. */
  color: string
  kicker: string
  icon: StationIcon
}

export const stations: Station[] = [
  {
    id: 'landing',
    name: 'Platform 0',
    nav: 'Start',
    platform: '00',
    code: 'P0',
    color: '#ffb547',
    kicker: 'Departures',
    icon: 'depot',
  },
  {
    id: 'profile',
    name: 'Parth Central',
    nav: 'Profile',
    platform: '01',
    code: 'PC',
    color: '#ffb547',
    kicker: 'About · Profile',
    icon: 'central',
  },
  {
    id: 'design',
    name: 'Design District',
    nav: 'Design',
    platform: '02',
    code: 'DD',
    color: '#ff7d8f',
    kicker: 'UI · UX · Graphics',
    icon: 'design',
  },
  {
    id: 'engineering',
    name: 'Engineering Station',
    nav: 'Engineering',
    platform: '03',
    code: 'ES',
    color: '#6fd0ff',
    kicker: 'Frontend · Technologies',
    icon: 'engineering',
  },
  {
    id: 'projects',
    name: 'Project Terminal',
    nav: 'Projects',
    platform: '04',
    code: 'PT',
    color: '#a993ff',
    kicker: 'Selected work',
    icon: 'projects',
  },
  {
    id: 'career',
    name: 'Career Line',
    nav: 'Career',
    platform: '05',
    code: 'CL',
    color: '#c6e66b',
    kicker: 'Professional experience',
    icon: 'career',
  },
  {
    id: 'ai-lab',
    name: 'AI Lab',
    nav: 'AI Lab',
    platform: '06',
    code: 'AI',
    color: '#53e0c2',
    kicker: 'AI-assisted workflow',
    icon: 'ai',
  },
  {
    id: 'contact',
    name: 'Final Station',
    nav: 'Contact',
    platform: '07',
    code: 'FS',
    color: '#eef2f8',
    kicker: 'Contact',
    icon: 'contact',
  },
]

export const stationById = Object.fromEntries(stations.map((s) => [s.id, s])) as Record<StationId, Station>

/** Stations shown on the metro map (Platform 0 is reached through the logo). */
export const mapStations = stations.filter((s) => s.id !== 'landing')

/**
 * A stop is a place the train comes to rest. Most stations have one; the Career Line
 * has one per role so the train can travel the timeline milestone by milestone.
 */
export interface Stop {
  station: StationId
  milestone?: number
}

export const stops: Stop[] = [
  { station: 'landing' },
  { station: 'profile' },
  { station: 'design' },
  { station: 'engineering' },
  { station: 'projects' },
  ...roles.map((_, milestone) => ({ station: 'career' as const, milestone })),
  { station: 'ai-lab' },
  { station: 'contact' },
]

export const firstStopOf = (id: StationId): number => stops.findIndex((s) => s.station === id)

export const CAREER_FIRST_STOP = firstStopOf('career')
export const CAREER_LAST_STOP = CAREER_FIRST_STOP + roles.length - 1
