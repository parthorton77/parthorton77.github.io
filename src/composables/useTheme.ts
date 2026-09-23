import { ref, computed, watch } from 'vue'

export type SiteTheme = 'transit' | 'terminal' | 'space'
export type ServiceMode = 'day' | 'night'

const THEME_KEY = 'pp-site-theme'
const SERVICE_KEY = 'pp-service-mode'
const DEFAULT_THEME: SiteTheme = 'transit'

/** The designs the on-screen switch cycles through. 'space' is kept working for old
 *  ?theme=space links, but is no longer part of the rotation. */
const SWITCHABLE: SiteTheme[] = ['transit', 'terminal']

const THEME_LABEL: Record<SiteTheme, string> = {
  transit: 'Transit map',
  terminal: 'Terminal',
  space: 'Space'
}

const isTheme = (value: unknown): value is SiteTheme =>
  value === 'transit' || value === 'terminal' || value === 'space'

const read = (key: string): string | null => {
  try { return localStorage.getItem(key) } catch { return null }
}
const write = (key: string, value: string) => {
  try { localStorage.setItem(key, value) } catch { /* private mode — theme just won't persist */ }
}

const initialTheme = (): SiteTheme => {
  const fromUrl = new URLSearchParams(window.location.search).get('theme')
  if (isTheme(fromUrl)) return fromUrl
  const stored = read(THEME_KEY)
  return isTheme(stored) ? stored : DEFAULT_THEME
}

const initialService = (): ServiceMode => {
  const stored = read(SERVICE_KEY)
  if (stored === 'day' || stored === 'night') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'
}

export const theme = ref<SiteTheme>(initialTheme())
export const service = ref<ServiceMode>(initialService())

/** The design the switch will move to next — what the button should advertise. */
export const nextTheme = computed<SiteTheme>(() => {
  const index = SWITCHABLE.indexOf(theme.value)
  return index === -1 ? SWITCHABLE[0] : SWITCHABLE[(index + 1) % SWITCHABLE.length]
})
export const nextThemeLabel = computed(() => THEME_LABEL[nextTheme.value])

const apply = () => {
  const root = document.documentElement
  root.dataset.theme = theme.value
  root.dataset.service = service.value

  const light = theme.value === 'transit' && service.value === 'day'
  root.style.colorScheme = light ? 'light' : 'dark'
  const color = theme.value === 'space' ? '#05070d'
    : theme.value === 'terminal' ? '#080b0a'
      : light ? '#f1ece1' : '#0f1217'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
}

apply()

watch(theme, value => {
  write(THEME_KEY, value)
  apply()
  // Keep the URL shareable — ?theme=… always lands on the design you're looking at.
  const url = new URL(window.location.href)
  url.searchParams.set('theme', value)
  history.replaceState(null, '', url)
})

watch(service, value => {
  write(SERVICE_KEY, value)
  apply()
})

export const toggleTheme = () => { theme.value = nextTheme.value }
export const toggleService = () => { service.value = service.value === 'day' ? 'night' : 'day' }
