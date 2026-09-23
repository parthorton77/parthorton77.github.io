<script setup lang="ts">
import TransitHeader from './TransitHeader.vue'
import TransitHero from './TransitHero.vue'
import TransitLine from './TransitLine.vue'
import TransitInterchange from './TransitInterchange.vue'
import TransitServiceBoard from './TransitServiceBoard.vue'
import TransitTerminals from './TransitTerminals.vue'
import TransitEndOfLine from './TransitEndOfLine.vue'
</script>

<template>
  <div class="transit">
    <div class="tm-paper" aria-hidden="true"></div>
    <TransitHeader />
    <main>
      <TransitHero />
      <TransitLine />
      <TransitInterchange />
      <TransitServiceBoard />
      <TransitTerminals />
      <TransitEndOfLine />
    </main>
  </div>
</template>
