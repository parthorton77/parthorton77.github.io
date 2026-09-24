/**
 * One-way cues from the page to the 3D world for moments that aren't state
 * (the departure signal, the AI core reacting to a question).
 */
type WorldEvent = 'depart' | 'think' | 'answer'

const handlers = new Map<WorldEvent, Set<() => void>>()

export const worldBus = {
  on(event: WorldEvent, fn: () => void): () => void {
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event)!.add(fn)
    return () => handlers.get(event)?.delete(fn)
  },
  emit(event: WorldEvent) {
    handlers.get(event)?.forEach((fn) => fn())
  },
}
