/**
 * Single source of truth for every professional fact on the site.
 *
 * Everything here was taken from the previous portfolio (parthorton77.github.io) and
 * its resume (Parth-Patel-Resume.pdf). Nothing is invented: when a detail wasn't
 * published there (project links, screenshots, a photo), the field is simply absent
 * and the UI hides it. Edit this file to update the site.
 */

export const CAREER_START_YEAR = 2016

/** Computed the same way the previous site did, so it stays correct over time. */
export const yearsOfExperience = Math.max(1, new Date().getFullYear() - CAREER_START_YEAR)

export const person = {
  name: 'Parth Patel',
  firstName: 'Parth',
  lastName: 'Patel',
  title: 'Senior UI Developer',
  /** Landing-screen title, as specified for the new site. */
  landingTitle: 'UI Developer',
  tagline: 'Designing interfaces. Engineering experiences.',
  /** Headline carried over from the previous portfolio. */
  statement: 'From designing visuals to building experiences.',
  intro:
    'A creative professional whose journey evolved from graphics and UI design into crafting responsive, interactive and reusable frontend experiences.',
  summary: `Senior UI Developer with ${yearsOfExperience} years of experience evolving from graphic and interface design into modern frontend engineering. Combines strong visual judgment with hands-on experience building responsive, reusable and accessible interfaces for financial services, education, assessment, e-commerce and pharmaceutical products.`,
  closing: "Let's build interfaces and experiences that look good, work well and make an impact.",
  /** The four-stage route shown on the resume and previous site. */
  route: ['Graphics', 'UI / UX', 'Frontend', 'UI Development'],
  domains: [
    'Financial services',
    'Education',
    'Assessment & surveys',
    'E-commerce',
    'Medical & pharmaceutical',
  ],
  current: { company: 'AV Devs', project: 'CrossCountry Mortgage' },
} as const

export const contact = {
  email: 'parthorton@yahoo.com',
  linkedin: 'https://www.linkedin.com/in/parth-patel-471235183/',
  linkedinLabel: 'linkedin.com/in/parth-patel-471235183',
  github: 'https://github.com/parthorton77',
  githubLabel: 'github.com/parthorton77',
  /** Relative so it resolves under any deploy base. */
  resume: 'Parth-Patel-Resume.pdf',
} as const

export interface Role {
  id: string
  start: number
  /** null = present */
  end: number | null
  role: string
  company: string
  /** Signage name for the Career Line gantries. */
  short: string
  project?: string
  /** One-line summary from the previous site. */
  summary: string
  /** Bullet points from the resume. */
  highlights: string[]
  tech: string[]
}

/** Oldest first — the order the train travels. */
export const roles: Role[] = [
  {
    id: 'cueserve',
    start: 2016,
    end: 2017,
    role: 'Graphics & Web Designer',
    company: 'Cueserve Inc.',
    short: 'Cueserve',
    summary:
      'Designed website layouts and graphics using Adobe Photoshop and Illustrator. This is where the professional journey began.',
    highlights: ['Designed website layouts and visual assets using Adobe Photoshop and Illustrator.'],
    tech: ['Photoshop', 'Illustrator'],
  },
  {
    id: 'webmyne',
    start: 2017,
    end: 2019,
    role: 'UI Designer & Developer',
    company: 'Webmyne Systems Pvt. Ltd.',
    short: 'Webmyne',
    summary: 'Designed PSDs and developed responsive user interfaces using modern frontend fundamentals.',
    highlights: [
      'Designed interface concepts and developed responsive user interfaces from PSD designs.',
      'Applied HTML, CSS, jQuery and JavaScript to build polished web experiences.',
    ],
    tech: ['HTML', 'CSS', 'jQuery', 'JavaScript'],
  },
  {
    id: 'pxel-perfect',
    start: 2019,
    end: 2020,
    role: 'UI Designer & Developer',
    company: 'Pxel Perfect',
    short: 'Pxel Perfect',
    summary:
      'Converted PSD designs into responsive HTML experiences for e-commerce, medical and pharmaceutical domains.',
    highlights: [
      'Converted PSD designs into responsive HTML experiences for e-commerce, medical and pharmaceutical domains.',
      'Balanced visual accuracy with practical, cross-device frontend implementation.',
    ],
    tech: ['HTML', 'CSS', 'jQuery', 'JavaScript'],
  },
  {
    id: 'open-eyes',
    start: 2020,
    end: 2021,
    role: 'Software Developer',
    company: 'Open Eyes Technologies Inc.',
    short: 'Open Eyes',
    summary: 'Designed and developed software experiences for education, assessment and survey-based products.',
    highlights: [
      'Designed and developed software experiences for education, assessment and survey-based products.',
      'Created responsive interfaces with React, JavaScript and SCSS.',
    ],
    tech: ['HTML', 'CSS', 'SCSS', 'JavaScript', 'React'],
  },
  {
    id: 'av-devs',
    start: 2021,
    end: null,
    role: 'Senior UI Developer',
    company: 'AV Devs',
    short: 'AV Devs',
    project: 'CrossCountry Mortgage',
    summary:
      'Building dynamic and reusable UI components and collaborating with frontend teams across financial-services products.',
    highlights: [
      'Build dynamic and reusable UI components for financial-services products and mortgage workflows.',
      'Collaborate with frontend teams to deliver consistent, maintainable and responsive experiences.',
    ],
    tech: ['Vue.js', 'TypeScript', 'SCSS', 'Git', 'JIRA'],
  },
]

export const currentRole = roles[roles.length - 1]

export function formatPeriod(r: Pick<Role, 'start' | 'end'>): string {
  return `${r.start} — ${r.end ?? 'Present'}`
}

export type SkillGroupId = 'frontend' | 'frameworks' | 'design' | 'workflow'

export interface SkillGroup {
  id: SkillGroupId
  title: string
  items: string[]
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'frontend',
    title: 'Frontend',
    items: ['HTML5', 'CSS3', 'SCSS', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'Bootstrap 5'],
  },
  { id: 'frameworks', title: 'Frameworks', items: ['Vue.js', 'React'] },
  { id: 'design', title: 'Design', items: ['Photoshop', 'Illustrator', 'UI Design', 'UI/UX'] },
  {
    id: 'workflow',
    title: 'Workflow',
    items: ['Claude Code', 'Git', 'GitHub', 'JIRA', 'VS Code', 'Liquid', 'jQuery'],
  },
]

/** Flagged "New" on the previous site and resume. */
export const newestSkills = ['Claude Code']

export const allSkills = skillGroups.flatMap((g) => g.items.map((name) => ({ name, group: g })))

export interface ProjectLink {
  label: string
  href: string
}

export interface Project {
  id: string
  number: string
  name: string
  category: string
  description: string
  role: string
  /** Links the exhibit to a career stop when the portfolio ties them together. */
  roleId?: string
  period?: string
  contributions: string[]
  tech: string[]
  /** Symbolic 3D miniature shown on the exhibit pedestal — not a product screenshot. */
  motif: 'house' | 'storefront' | 'assessment'
  /** None were published on the previous site; add real ones here and the UI will show them. */
  links?: ProjectLink[]
  screenshots?: { src: string; alt: string }[]
}

export const projects: Project[] = [
  {
    id: 'crosscountry-mortgage',
    number: '01',
    name: 'CrossCountry Mortgage',
    category: 'Financial Services',
    description: 'Dynamic, reusable user interface development for mortgage and financial-services workflows.',
    role: 'Senior UI Developer · AV Devs',
    roleId: 'av-devs',
    period: '2021 — Present',
    contributions: [
      'Build dynamic and reusable UI components for financial-services products and mortgage workflows.',
      'Collaborate with frontend teams to deliver consistent, maintainable and responsive experiences.',
    ],
    tech: ['Vue.js', 'SCSS', 'HTML5', 'Git', 'Claude Code'],
    motif: 'house',
  },
  {
    id: 'pinter',
    number: '02',
    name: 'Pinter',
    category: 'Food & Beverage · Shopify',
    description: 'UI development for a food and beverage company using Shopify and frontend web technologies.',
    role: 'UI Development',
    contributions: [
      'Shopify UI development for a food and beverage company.',
      'Worked with HTML5, CSS3, JavaScript and Liquid, Shopify’s templating language.',
    ],
    tech: ['HTML5', 'CSS3', 'JavaScript', 'Liquid'],
    motif: 'storefront',
  },
  {
    id: 'education-assessment',
    number: '03',
    name: 'Education & Assessment',
    category: 'Software Development',
    description: 'Responsive interfaces and software experiences across education, assessment and survey domains.',
    // The previous portfolio doesn't say which employer this was for, so no role link is claimed.
    // If it was the Open Eyes work, add `roleId: 'open-eyes'` and `period: '2020 — 2021'`.
    role: 'Software development',
    contributions: ['Responsive interfaces for education, assessment and survey products.'],
    tech: ['React', 'SCSS', 'JavaScript'],
    motif: 'assessment',
  },
]
