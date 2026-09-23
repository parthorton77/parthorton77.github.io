<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { service, toggleService } from '../../composables/useTheme'

const open = ref(false)
const active = ref('home')
const links = [
  { label: 'Map', id: 'home' },
  { label: 'Line 1', id: 'journey' },
  { label: 'Interchange', id: 'skills' },
  { label: 'Service', id: 'stats' },
  { label: 'Terminals', id: 'projects' },
  { label: 'End of line', id: 'contact' }
]

const goTo = (id: string) => {
  open.value = false
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const onScroll = () => {
  const sections = links
    .map(link => document.getElementById(link.id))
    .filter((section): section is HTMLElement => Boolean(section))

  const current = sections.find(section => {
    const rect = section.getBoundingClientRect()
    return rect.top <= window.innerHeight * 0.42 && rect.bottom >= window.innerHeight * 0.42
  })
  if (current) active.value = current.id
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header class="tm-header">
    <button class="tm-roundel tm-roundel--small" type="button" aria-label="Back to the map" @click="goTo('home')">
      <span class="tm-roundel__ring"></span>
      <span class="tm-roundel__bar">PP</span>
    </button>

    <nav class="tm-nav" :class="{ 'is-open': open }" aria-label="Sections">
      <span class="tm-nav__rail" aria-hidden="true"></span>
      <button
        v-for="link in links"
        :key="link.id"
        type="button"
        class="tm-nav__stop"
        :class="{ 'is-active': active === link.id }"
        :aria-current="active === link.id ? 'true' : undefined"
        @click="goTo(link.id)"
      >
        <i aria-hidden="true"></i>
        <span>{{ link.label }}</span>
      </button>
    </nav>

    <div class="tm-header__tools">
      <button
        class="tm-service"
        type="button"
        aria-label="Night service"
        :aria-pressed="service === 'night'"
        @click="toggleService"
      >
        <i aria-hidden="true"></i><span>{{ service === 'night' ? 'Night service' : 'Day service' }}</span>
      </button>
      <button class="tm-burger" type="button" :aria-expanded="open" aria-label="Menu" @click="open = !open">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>
</template>
