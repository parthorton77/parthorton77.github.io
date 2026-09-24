import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Marks a station as "arrived" the first time it scrolls into view, so its panel can
 * reveal itself. The hidden state only applies once JS has confirmed it can un-hide
 * (html.js-reveal), so content can never get stuck invisible.
 */
export function useArrival(el: Ref<HTMLElement | undefined>) {
  const arrived = ref(false)
  let io: IntersectionObserver | null = null

  onMounted(() => {
    document.documentElement.classList.add('js-reveal')
    if (!el.value || !('IntersectionObserver' in window)) {
      arrived.value = true
      return
    }
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          arrived.value = true
          io?.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el.value)
  })

  onBeforeUnmount(() => io?.disconnect())
  return arrived
}
