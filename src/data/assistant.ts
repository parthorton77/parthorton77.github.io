import {
  allSkills,
  contact,
  currentRole,
  formatPeriod,
  newestSkills,
  person,
  projects,
  roles,
  skillGroups,
  yearsOfExperience,
} from './portfolio'
import type { StationId } from './stations'

/**
 * "Ask Parth's Portfolio" — a deliberately small, local question router. There is no
 * model and no network call: questions are matched to intents by keyword and answered
 * only from the data in portfolio.ts. If something isn't in the data, it says so.
 */

export interface AssistantAction {
  label: string
  station?: StationId
  href?: string
}

export interface AssistantAnswer {
  text: string
  /** Which parts of the portfolio the answer was assembled from. */
  sources: string[]
  actions?: AssistantAction[]
}

export const suggestions = [
  'What technologies does Parth use?',
  'What kind of UI development does Parth do?',
  "Tell me about Parth's experience.",
  'What has Parth built?',
  'How can I contact Parth?',
]

const list = (items: string[]) =>
  items.length <= 2 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

const normalise = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9.+#/\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// Technologies known to the portfolio (skills + anything named on roles/projects).
const TECH_ALIASES: Record<string, string> = {
  vue: 'Vue.js',
  vuejs: 'Vue.js',
  'vue.js': 'Vue.js',
  react: 'React',
  reactjs: 'React',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  javascript: 'JavaScript',
  js: 'JavaScript',
  html: 'HTML5',
  html5: 'HTML5',
  css: 'CSS3',
  css3: 'CSS3',
  scss: 'SCSS',
  sass: 'SCSS',
  tailwind: 'Tailwind CSS',
  bootstrap: 'Bootstrap 5',
  jquery: 'jQuery',
  git: 'Git',
  github: 'GitHub',
  jira: 'JIRA',
  vscode: 'VS Code',
  'vs code': 'VS Code',
  liquid: 'Liquid',
  shopify: 'Liquid',
  photoshop: 'Photoshop',
  illustrator: 'Illustrator',
  claude: 'Claude Code',
  'claude code': 'Claude Code',
}

// Commonly asked-about tools that are *not* in the portfolio — answered honestly, by name.
const NOT_LISTED = [
  'Angular',
  'Svelte',
  'Next.js',
  'NextJS',
  'Nuxt',
  'Node.js',
  'NodeJS',
  'Node',
  'Express',
  'Python',
  'Java',
  'PHP',
  'C#',
  '.NET',
  'Figma',
  'Sketch',
  'Adobe XD',
  'XD',
  'PrimeVue',
  'Vuetify',
  'Vuex',
  'Pinia',
  'Redux',
  'GraphQL',
  'Three.js',
  'ThreeJS',
  'WebGL',
  'GSAP',
  'Flutter',
  'Swift',
  'Kotlin',
  'GitHub Copilot',
  'Copilot',
  'ChatGPT',
  'GPT',
  'Cursor',
  'Gemini',
  'Jest',
  'Vitest',
  'Cypress',
  'Playwright',
  'Storybook',
  'Webpack',
  'Vite',
  'Material UI',
  'MUI',
  'Docker',
  'AWS',
].sort((a, b) => b.length - a.length)

const escapeRe = (s: string) => s.replace(/[.+#*?^$()[\]{}|\\]/g, '\\$&')
const hasTerm = (q: string, term: string) => new RegExp(`(^|\\s)${escapeRe(term.toLowerCase())}(\\s|$)`).test(q)

function techUsage(name: string) {
  const names = name === 'HTML5' ? ['HTML5', 'HTML'] : name === 'CSS3' ? ['CSS3', 'CSS'] : [name]
  return {
    roles: roles.filter((r) => r.tech.some((t) => names.includes(t))),
    projects: projects.filter((p) => p.tech.some((t) => names.includes(t))),
  }
}

function answerTech(name: string, note = ''): AssistantAnswer {
  const skill = allSkills.find((s) => s.name === name)
  const { roles: rs, projects: ps } = techUsage(name)
  const parts: string[] = []
  parts.push(`Yes — ${name} is in Parth's toolkit${skill ? ` (${skill.group.title.toLowerCase()} line)` : ''}.${note}`)
  if (rs.length) parts.push(`It shows up in ${list(rs.map((r) => `${r.company} (${formatPeriod(r)})`))}.`)
  if (ps.length) parts.push(`Exhibits using it: ${list(ps.map((p) => p.name))}.`)
  if (newestSkills.includes(name)) parts.push('It is the newest addition to the workflow.')
  return {
    text: parts.join(' '),
    sources: ['skills', ...(rs.length ? ['career'] : []), ...(ps.length ? ['projects'] : [])],
    actions: [{ label: 'Open Engineering Station', station: 'engineering' }],
  }
}

type Intent = { id: string; words: RegExp; answer: () => AssistantAnswer }

const intents: Intent[] = [
  {
    id: 'greeting',
    words: /^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/,
    answer: () => ({
      text: `Hi! I answer questions about ${person.firstName}'s work using only what's on this site — technologies, UI work, experience, projects and contact details.`,
      sources: ['portfolio'],
    }),
  },
  {
    id: 'contact',
    words: /\b(contact\w*|e-?mail|mail|reach|hir(e|ing)|availab\w*|linkedin|message|talk|connect\w*|github)\b/,
    answer: () => ({
      text: `The quickest route is email: ${contact.email}. ${person.firstName} is also on LinkedIn (${contact.linkedinLabel}) and GitHub (${contact.githubLabel}).`,
      sources: ['contact'],
      actions: [
        { label: 'Email Parth', href: `mailto:${contact.email}` },
        { label: 'Final Station', station: 'contact' },
      ],
    }),
  },
  {
    id: 'resume',
    words: /\b(resume|résumé|cv|curriculum)\b/,
    answer: () => ({
      text: `The résumé is a one-page PDF covering the profile, all ${roles.length} roles, skills and selected work.`,
      sources: ['resume'],
      actions: [{ label: 'Open the résumé', href: contact.resume }],
    }),
  },
  {
    id: 'ai',
    words: /\b(ai|a\.i\.|claude|llm|assistant|machine learning|artificial)\b/,
    answer: () => ({
      text: `Claude Code is part of ${person.firstName}'s current workflow — the newest tool on the résumé, alongside Git, GitHub, JIRA and VS Code, and listed on the CrossCountry Mortgage work. As for me: I'm not an AI model — I'm a small matcher running in your browser that answers from this portfolio's content.`,
      sources: ['skills', 'projects'],
      actions: [{ label: 'Workflow line', station: 'ai-lab' }],
    }),
  },
  {
    id: 'projects',
    words: /\b(project\w*|built|build\w*|work samples?|exhibit\w*|clients?|case stud(y|ies)|shipped|made)\b/,
    answer: () => ({
      text: `Three exhibits: ${projects.map((p) => `${p.name} — ${p.description.replace(/\.$/, '')}`).join('; ')}.`,
      sources: ['projects'],
      actions: [{ label: 'Visit Project Terminal', station: 'projects' }],
    }),
  },
  {
    id: 'current',
    words: /\b(current\w*|right now|today|present\w*|where (does|do) .* work)\b/,
    answer: () => ({
      text: `Right now: ${currentRole.role} at ${currentRole.company}, on ${currentRole.project} (${formatPeriod(currentRole)}). ${currentRole.highlights.join(' ')}`,
      sources: ['career'],
      actions: [{ label: 'Career Line', station: 'career' }],
    }),
  },
  {
    id: 'experience',
    words: /\b(experience\w*|career\w*|histor\w*|background|years?|worked|roles?|compan\w*|jobs?|journey|timeline|employ\w*)\b/,
    answer: () => ({
      text: `${yearsOfExperience} years across ${roles.length} roles, oldest first: ${roles
        .map((r) => `${r.start} ${r.role} at ${r.company}`)
        .join(' → ')}. The line runs ${person.route.join(' → ')}.`,
      sources: ['career'],
      actions: [{ label: 'Ride the Career Line', station: 'career' }],
    }),
  },
  {
    id: 'design',
    words: /\b(design\w*|ux|graphic\w*|visual\w*|photoshop|illustrator|wireframe\w*|prototyp\w*|typograph\w*)\b/,
    answer: () => ({
      text: `The career began in design: graphics and web design at Cueserve (2016), then interface concepts and PSD designs at Webmyne, and converting PSD designs into responsive HTML at Pxel Perfect. The design line on the résumé lists ${list(
        skillGroups.find((g) => g.id === 'design')!.items,
      )}.`,
      sources: ['career', 'skills'],
      actions: [{ label: 'Design District', station: 'design' }],
    }),
  },
  {
    id: 'ui',
    words: /\b(ui|frontend|front-end|front end|interfaces?|components?|what (kind|type) of|specialis|speciali[sz]e|what does .* do|responsive|accessib)/,
    answer: () => ({
      text: `${person.firstName} builds dynamic, reusable UI components for financial-services products and mortgage workflows, and has shipped responsive, reusable and accessible interfaces for ${list(
        person.domains.map((d) => d.toLowerCase()),
      )}. Day to day that means ${list(currentRole.tech)}.`,
      sources: ['profile', 'career'],
      actions: [{ label: 'Parth Central', station: 'profile' }],
    }),
  },
  {
    id: 'tech',
    words: /\b(tech\w*|stack|skill\w*|tool\w*|language\w*|framework\w*|librar\w*|uses?|know\w*)\b/,
    answer: () => ({
      text: skillGroups.map((g) => `${g.title}: ${g.items.join(', ')}`).join('. ') + '.',
      sources: ['skills'],
      actions: [{ label: 'Engineering Station', station: 'engineering' }],
    }),
  },
  {
    id: 'education',
    words: /\b(education\w*|school\w*|studied|study|studies)\b/,
    answer: () => ({
      text: `Formal education isn't listed on this portfolio. Education is one of the domains ${person.firstName} has built for, though — see the Education & Assessment exhibit.`,
      sources: ['projects'],
      actions: [{ label: 'Project Terminal', station: 'projects' }],
    }),
  },
  {
    id: 'unlisted-personal',
    words: /\b(location|located|based|city|country|salary|rate|visa|relocat\w*|remote|age|degree|university|college|qualification\w*)\b/,
    answer: () => ({
      text: `That isn't listed on this portfolio, so I won't guess. The best way to ask is email: ${contact.email}.`,
      sources: [],
      actions: [{ label: 'Email Parth', href: `mailto:${contact.email}` }],
    }),
  },
]

export function ask(question: string): AssistantAnswer {
  const q = normalise(question)
  if (!q) return fallback()

  // Specific technologies first — they deserve a precise yes/no.
  const unlisted = NOT_LISTED.find((t) => hasTerm(q, t))
  if (unlisted) {
    return {
      text: `${unlisted} isn't listed in ${person.firstName}'s toolkit on this portfolio. The core of what is listed: ${list(
        ['HTML5', 'CSS3', 'SCSS', 'JavaScript', 'TypeScript', 'Vue.js', 'React'].filter((t) => allSkills.some((s) => s.name === t)),
      )}.`,
      sources: ['skills'],
      actions: [{ label: 'See the full directory', station: 'engineering' }],
    }
  }
  const aliasKey = Object.keys(TECH_ALIASES)
    .sort((a, b) => b.length - a.length)
    .find((k) => hasTerm(q, k))
  // Only a question with no specific technology in it gets the whole directory.
  const broad = /\b(technolog\w*|stack|skills|tools)\b/.test(q)
  // 'What's Parth's GitHub?' wants the profile link, not a skills answer.
  if (aliasKey === 'github' && !/\b(use|uses|know|experience)\b/.test(q)) return intents.find((i) => i.id === 'contact')!.answer()
  if (aliasKey && !broad) {
    const name = TECH_ALIASES[aliasKey]
    // The résumé says "Vue.js" — don't confirm a specific major version.
    const versioned = name === 'Vue.js' && /\bvue(\.?js)?\s?[23]\b/.test(q)
    return answerTech(name, versioned ? ' The portfolio lists Vue.js without a version number.' : '')
  }

  for (const intent of intents) if (intent.words.test(q)) return intent.answer()
  return fallback()
}

function fallback(): AssistantAnswer {
  return {
    text: `I can only answer from this portfolio: ${person.firstName}'s technologies, UI work, experience, projects and contact details. Try one of the suggestions below.`,
    sources: [],
  }
}
