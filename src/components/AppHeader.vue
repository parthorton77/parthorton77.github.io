<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const open = ref(false)
const active = ref('home')
const links = [
  { label: 'Home', id: 'home' },
  { label: 'Journey', id: 'journey' },
  { label: 'Skills', id: 'skills' },
  { label: 'Stats', id: 'stats' },
  { label: 'Projects', id: 'projects' },
  { label: 'Contact', id: 'contact' }
]

const scrollToSection = (id: string) => {
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
  <header class="site-header">
    <button class="brand" type="button" aria-label="Go to home" @click="scrollToSection('home')">
      <span class="brand-mark">P.</span>
      <span>PARTH PATEL</span>
    </button>

    <button class="menu-button" type="button" :aria-expanded="open" @click="open = !open">
      <span></span><span></span>
    </button>

    <nav :class="{ open }">
      <button
        v-for="link in links"
        :key="link.id"
        type="button"
        :class="{ active: active === link.id }"
        @click="scrollToSection(link.id)"
      >
        {{ link.label }}
      </button>
    </nav>
  </header>
</template>