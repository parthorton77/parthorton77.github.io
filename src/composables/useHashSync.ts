import { onBeforeUnmount, onMounted, watch } from 'vue'
import { app } from '@/state/app'
import { jumpJourney, measureStops, scrollForStop } from '@/state/journey'
import { goToStation } from '@/state/navigation'
import { firstStopOf, stations, type StationId } from '@/data/stations'

const isStation = (id: string): id is StationId => stations.some((s) => s.id === id)

/**
 * Deep links: /#projects opens straight onto the Project Terminal (no cinematic), and the
 * address bar follows the train so any station can be shared.
 */
export function useHashSync() {
  let timer = 0

  const onHashChange = () => {
    const id = location.hash.slice(1)
    if (isStation(id) && id !== app.activeStation) goToStation(id)
  }

  onMounted(async () => {
    const id = location.hash.slice(1)
    if (isStation(id) && id !== 'landing') {
      // Wait for web fonts so section heights (and therefore stop positions) are final.
      await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1200))])
      measureStops()
      const stop = firstStopOf(id)
      window.scrollTo(0, scrollForStop(stop))
      jumpJourney(stop)
    }
    window.addEventListener('hashchange', onHashChange)
  })

  watch(
    () => app.activeStation,
    (id) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const url = id === 'landing' ? location.pathname + location.search : `#${id}`
        history.replaceState(null, '', url)
      }, 350)
    },
  )

  onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange))
}
