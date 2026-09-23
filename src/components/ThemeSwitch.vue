<script setup lang="ts">
import { nextTheme, nextThemeLabel, toggleTheme } from '../composables/useTheme'

const icons = { transit: '◉', terminal: '▊', space: '✦' }
</script>

<template>
  <button
    class="theme-switch"
    type="button"
    :title="`Switch to the ${nextThemeLabel.toLowerCase()} design`"
    @click="toggleTheme"
  >
    <span class="theme-switch__icon" aria-hidden="true">{{ icons[nextTheme] }}</span>
    <span class="theme-switch__label">
      <b>{{ nextThemeLabel }}</b>
      <i>switch design</i>
    </span>
  </button>
</template>
