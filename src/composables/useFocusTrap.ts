import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Keeps keyboard focus inside a dialog while it's open, closes on Escape, and restores focus on close. */
export function useFocusTrap(container: Ref<HTMLElement | undefined>, open: () => boolean, onClose: () => void) {
  let returnTo: HTMLElement | null = null

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !container.value) return
    const items = [...container.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(open, async (isOpen) => {
    if (isOpen) {
      returnTo = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKey)
      await nextTick()
      const target = container.value?.querySelector<HTMLElement>('[data-autofocus]') ?? container.value
      target?.focus({ preventScroll: true })
    } else {
      document.removeEventListener('keydown', onKey)
      // If closing the dialog already moved focus somewhere meaningful (e.g. navigation to a
      // station heading), leave it there; only restore when focus is lost or still inside.
      const active = document.activeElement
      if (!active || active === document.body || container.value?.contains(active)) {
        returnTo?.focus({ preventScroll: true })
      }
      returnTo = null
    }
  })

  onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
}
