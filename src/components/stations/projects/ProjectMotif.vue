<script setup lang="ts">
import type { Project } from '@/data/portfolio'

/** Line-art versions of the 3D exhibit holograms (symbolic, not product screenshots). */
defineProps<{ motif: Project['motif']; size?: number }>()
</script>

<template>
  <svg
    class="motif"
    :width="size ?? 56"
    :height="size ?? 56"
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linejoin="round"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <template v-if="motif === 'house'">
      <path d="M12 30 32 14l20 16" />
      <path d="M17 26v24h30V26" />
      <path d="M27 50V38h10v12" />
      <path d="M41 19v-5h4v8" />
      <rect x="21" y="31" width="6" height="5" rx="1" />
    </template>
    <template v-else-if="motif === 'storefront'">
      <path d="M12 26h40v24H12z" />
      <path d="M10 26l4-10h36l4 10" />
      <path d="M10 26c2 4 7 4 9 0 2 4 7 4 9 0 2 4 7 4 9 0 2 4 7 4 9 0 2 4 5 4 7 0" />
      <path d="M18 50V36h10v14" />
      <rect x="33" y="35" width="13" height="8" rx="1" />
    </template>
    <template v-else>
      <rect x="12" y="12" width="26" height="40" rx="3" />
      <path d="M20 10h10v5H20z" />
      <path d="m17 24 2.5 2.5L24 22M17 33l2.5 2.5L24 31M17 42l2.5 2.5L24 40" />
      <path d="M27 25h6M27 34h6M27 43h6" />
      <path d="M44 52V38M50 52V30M56 52V42" />
    </template>
  </svg>
</template>
