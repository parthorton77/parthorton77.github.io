<script setup lang="ts">
import { app } from '@/state/app'
</script>

<template>
  <div class="bars" :class="{ 'is-on': app.cinematic }" aria-hidden="true">
    <span class="bars__bar bars__bar--top" />
    <span class="bars__bar bars__bar--bottom" />
  </div>
</template>

<style scoped lang="scss">
.bars {
  position: fixed;
  inset: 0;
  z-index: 45;
  pointer-events: none;
}

.bars__bar {
  position: absolute;
  left: 0;
  right: 0;
  height: 9vh;
  background: #020305;
  transition: transform 0.9s var(--ease-in-out);
}

.bars__bar--top {
  top: 0;
  transform: translateY(-101%);
}

.bars__bar--bottom {
  bottom: 0;
  transform: translateY(101%);
}

.is-on .bars__bar {
  transform: none;
}
</style>
