import { experiences } from '../../data/experience'
import { skillGroups } from '../../data/skills'
import { projects } from '../../data/projects'
import { theme } from '../../composables/useTheme'
import { openedYear, yearsRunning, skillCount } from '../../data/career'

export interface Line {
  kind: 'cmd' | 'out' | 'dim' | 'err' | 'ok'
  text: string
}

export { openedYear, yearsRunning, skillCount }

const SECTIONS: Record<string, string> = {
  home: 'home',
  boot: 'home',
  career: 'journey',
  journey: 'journey',
  experience: 'journey',
  skills: 'skills',
  status: 'stats',
  stats: 'stats',
  projects: 'projects',
  work: 'projects',
  contact: 'contact'
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

const out = (text: string): Line => ({ kind: 'out', text })
const dim = (text: string): Line => ({ kind: 'dim', text })
const err = (text: string): Line => ({ kind: 'err', text })
const ok = (text: string): Line => ({ kind: 'ok', text })

const HELP: Line[] = [
  out('Available commands'),
  dim('  help                 this list'),
  dim('  whoami               who you are talking to'),
  dim('  ls                   list the sections of this site'),
  dim('  cd <section>         jump to a section'),
  dim('  skills               print the skill tree'),
  dim('  projects             list shipped work'),
  dim('  experience           print the career log'),
  dim('  resume               download the PDF resume'),
  dim('  contact              how to get in touch'),
  dim('  theme                switch to the transit map design'),
  dim('  clear                clear this output')
]

/** Runs one command and returns the lines to append. `null` means "clear the screen". */
export const runCommand = (raw: string): Line[] | null => {
  const input = raw.trim()
  if (!input) return []

  const [name, ...rest] = input.split(/\s+/)
  const arg = rest.join(' ').toLowerCase()

  switch (name.toLowerCase()) {
    case 'help':
    case '?':
      return HELP

    case 'whoami':
      return [
        out('Parth Patel — Senior UI Developer'),
        dim(`  ${yearsRunning} years, ${experiences.length} roles, designer turned developer`),
        dim('  currently at AV Devs, on CrossCountry Mortgage')
      ]

    case 'ls':
    case 'dir':
      return [out('home  journey  skills  stats  projects  contact')]

    case 'cd':
    case 'open':
    case 'goto': {
      if (!arg) return [err('cd: missing operand — try `ls` to see the sections')]
      const target = SECTIONS[arg.replace(/^\/+|\/+$/g, '')]
      if (!target) return [err(`cd: ${arg}: no such section`)]
      scrollTo(target)
      return [ok(`→ ${target}`)]
    }

    case 'skills':
      scrollTo('skills')
      return [
        out(`${skillCount} entries across ${skillGroups.length} groups`),
        ...skillGroups.map(group => dim(`  ${group.title.toLowerCase().padEnd(12)} ${group.items.join('  ')}`))
      ]

    case 'projects':
      scrollTo('projects')
      return [
        out(`${projects.length} targets`),
        ...projects.map(project => dim(`  ${project.number}  ${project.name} — ${project.category}`))
      ]

    case 'experience':
    case 'career':
      scrollTo('journey')
      return [
        out(`career log — ${experiences.length} entries`),
        ...experiences.map(role => dim(`  ${role.year.padEnd(16)} ${role.role} @ ${role.company}`))
      ]

    case 'resume':
    case 'cv': {
      const link = document.createElement('a')
      link.href = '/Parth-Patel-Resume.pdf'
      link.download = 'Parth-Patel-Resume.pdf'
      link.click()
      return [ok('downloading Parth-Patel-Resume.pdf …')]
    }

    case 'contact':
    case 'mail':
      scrollTo('contact')
      return [
        out('parthorton@yahoo.com'),
        dim('  linkedin.com/in/parth-patel-471235183')
      ]

    case 'theme':
      theme.value = 'transit'
      return [ok('switching to the transit map design …')]

    case 'clear':
    case 'cls':
      return null

    case 'sudo':
      return [err("sudo: you're already the most important visitor here")]

    case 'exit':
    case 'quit':
      return [dim('there is no exit — try `cd projects` instead')]

    default:
      return [err(`${name}: command not found — try \`help\``)]
  }
}
