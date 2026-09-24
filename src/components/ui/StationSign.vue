<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { Station } from '@/data/stations'

defineProps<{ station: Station; headingId: string; as?: 'h1' | 'h2' }>()
</script>

<template>
  <header class="sign">
    <p class="sign__meta">
      <span class="sign__plate">Platform {{ station.platform }}</span>
      <span class="sign__rule" aria-hidden="true" />
      <span class="sign__kicker">{{ station.kicker }}</span>
    </p>
    <component :is="as ?? 'h2'" :id="headingId" class="sign__name" tabindex="-1">
      <span class="sign__badge" aria-hidden="true"><AppIcon :name="station.icon" :size="22" /></span>
      <span class="sign__text">{{ station.name }}</span>
    </component>
    <div v-if="$slots.default" class="sign__lede"><slot /></div>
  </header>
</template>

<style scoped lang="scss">
.sign {
  display: grid;
  gap: 14px;
}

.sign__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-2);
  @include hud-label;
}

.sign__plate {
  padding: 5px 9px 4px;
  border: 1px solid color-mix(in srgb, var(--station) 55%, transparent);
  border-radius: 4px;
  color: var(--station);
}

.sign__rule {
  width: 28px;
  height: 1px;
  background: var(--hair-2);
}

.sign__name {
  display: flex;
  align-items: center;
  gap: 14px;
  @include display(800);
  font-size: clamp(1.9rem, 1.1rem + 2.6vw, 3.4rem);
  line-height: 1;
  text-wrap: balance;
}

.sign__badge {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--station) 16%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--station) 40%, transparent) inset;
  color: var(--station);
}

.sign__lede {
  max-width: 56ch;
  color: var(--text-2);
  font-size: 1.0625rem;
  line-height: 1.65;
}
</style>
