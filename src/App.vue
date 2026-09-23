<script setup lang="ts">
import SpaceSite from './themes/SpaceSite.vue'
import TransitSite from './themes/transit/TransitSite.vue'
import TerminalSite from './themes/terminal/TerminalSite.vue'
import ThemeSwitch from './components/ThemeSwitch.vue'
import { theme } from './composables/useTheme'
</script>

<template>
  <TransitSite v-if="theme === 'transit'" />
  <TerminalSite v-else-if="theme === 'terminal'" />
  <SpaceSite v-else />
  <ThemeSwitch />
</template>
