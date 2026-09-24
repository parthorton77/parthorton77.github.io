<script setup lang="ts">
import { computed } from 'vue'

/** Line icons drawn for this site on a 24px grid; brand marks are the simple-icons glyphs. */
const STROKE: Record<string, string> = {
  depot:
    '<rect x="6" y="3" width="12" height="14.5" rx="4"/><path d="M8.5 8.5h7M9 13.5h.01M15 13.5h.01M8.5 21l2-3.5M15.5 21l-2-3.5"/>',
  central: '<path d="M3 20.5h18M5 20.5v-9a7 7 0 0 1 14 0v9M9 20.5v-5h6v5M12 4.5V3"/>',
  design:
    '<path d="M4.5 18.5C6 9.5 18 14.5 19.5 5.5"/><path d="M4.5 18.5 9 10M19.5 5.5 15 14"/><circle cx="9" cy="10" r="1.4"/><circle cx="15" cy="14" r="1.4"/><rect x="3" y="17" width="3" height="3" rx=".6"/><rect x="18" y="4" width="3" height="3" rx=".6"/>',
  engineering: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15"/>',
  projects: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M7 8h5M7 11h8"/>',
  career: '<path d="M6 21 9.5 3M18 21 14.5 3M5.5 17.5h13M6.6 12.5h10.8M7.7 7.5h8.6"/>',
  ai: '<path d="M11 3.5c.6 4 2.6 6 6.5 6.5-3.9.5-5.9 2.5-6.5 6.5-.6-4-2.6-6-6.5-6.5 3.9-.5 5.9-2.5 6.5-6.5Z"/><path d="M18.5 15.5c.2 1.4.9 2.1 2.3 2.3-1.4.2-2.1.9-2.3 2.3-.2-1.4-.9-2.1-2.3-2.3 1.4-.2 2.1-.9 2.3-2.3Z"/>',
  contact:
    '<path d="M12 12v8.5M9 20.5h6"/><circle cx="12" cy="10" r="2"/><path d="M8.2 6.4a5.2 5.2 0 0 0 0 7.2M15.8 6.4a5.2 5.2 0 0 1 0 7.2M5.3 3.6a9.2 9.2 0 0 0 0 12.8M18.7 3.6a9.2 9.2 0 0 1 0 12.8"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  'arrow-down': '<path d="M12 5v14M6 13l6 6 6-6"/>',
  'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
  external: '<path d="M7 17 17 7M9 7h8v8"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7.5 8 5.5 8-5.5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2Z"/><path d="M9 4v14M15 6v14"/>',
  pause: '<rect x="6.5" y="5" width="3.5" height="14" rx="1"/><rect x="14" y="5" width="3.5" height="14" rx="1"/>',
  play: '<path d="M7.5 5.5v13l11-6.5Z"/>',
  cube: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  layers: '<path d="m12 4 9 5-9 5-9-5Z"/><path d="m3 14 9 5 9-5"/>',
  send: '<path d="M4.5 12h14M13 6l6 6-6 6"/>',
  spark: '<path d="M12 4v4M12 16v4M4 12h4M16 12h4"/>',
}

const FILL: Record<string, string> = {
  github:
    '<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
  linkedin:
    '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
}

const props = withDefaults(defineProps<{ name: string; size?: number | string }>(), { size: 20 })

const filled = computed(() => props.name in FILL)
const markup = computed(() => FILL[props.name] ?? STROKE[props.name] ?? '')
</script>

<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    :fill="filled ? 'currentColor' : 'none'"
    :stroke="filled ? 'none' : 'currentColor'"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="markup"
  />
</template>

<style scoped>
.icon {
  flex: none;
}
</style>
