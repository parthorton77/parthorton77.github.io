<script setup lang="ts">
import SplitFlap from '@/components/ui/SplitFlap.vue'
import { app } from '@/state/app'
</script>

<template>
  <Transition name="transfer">
    <div v-if="app.transferTo" class="transfer" aria-hidden="true">
      <p class="transfer__label">Express service</p>
      <SplitFlap class="transfer__flap" :text="app.transferTo" tone="signal" />
      <span class="transfer__rail"><i /></span>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.transfer {
  position: fixed;
  inset: 0;
  z-index: 55;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 18px;
  background: radial-gradient(ellipse at center, rgb(10 14 23 / 0.9), rgb(3 5 9 / 0.98));
  pointer-events: none;
}

.transfer__label {
  color: var(--text-3);
  @include hud-label;
}

.transfer__flap {
  font-size: clamp(1rem, 2.4vw, 1.5rem);
}

.transfer__rail {
  position: relative;
  width: 180px;
  height: 2px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--hair);

  i {
    position: absolute;
    inset: 0;
    background: var(--signal);
    transform-origin: left;
    animation: transfer-run 0.64s var(--ease-in-out) forwards;
  }
}

@keyframes transfer-run {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.transfer-enter-active {
  transition: opacity 0.28s var(--ease-out);
}
.transfer-leave-active {
  transition: opacity 0.42s var(--ease-out);
}
.transfer-enter-from,
.transfer-leave-to {
  opacity: 0;
}
</style>
