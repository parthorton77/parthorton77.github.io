<script setup lang="ts">
import TerminalHeader from './TerminalHeader.vue'
import TerminalBoot from './TerminalBoot.vue'
import TerminalCareer from './TerminalCareer.vue'
import TerminalSkills from './TerminalSkills.vue'
import TerminalStatus from './TerminalStatus.vue'
import TerminalProjects from './TerminalProjects.vue'
import TerminalContact from './TerminalContact.vue'
</script>

<template>
  <div class="terminal">
    <div class="tr-crt" aria-hidden="true"></div>
    <TerminalHeader />
    <main>
      <TerminalBoot />
      <TerminalCareer />
      <TerminalSkills />
      <TerminalStatus />
      <TerminalProjects />
      <TerminalContact />
    </main>
  </div>
</template>
