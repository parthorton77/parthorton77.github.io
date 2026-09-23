<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const active = ref('home')
const tabs = [
  { label: 'boot', id: 'home' },
  { label: 'career', id: 'journey' },
  { label: 'skills', id: 'skills' },
  { label: 'status', id: 'stats' },
  { label: 'projects', id: 'projects' },
  { label: 'contact', id: 'contact' }
]

const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

const onScroll = () => {
  const sections = tabs
    .map(tab => document.getElementById(tab.id))
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
  <header class="tr-header">
    <span class="tr-header__session" aria-hidden="true">[0] parth@portfolio</span>

    <nav class="tr-tabs" aria-label="Sections">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        type="button"
        class="tr-tab"
        :class="{ 'is-active': active === tab.id }"
        :aria-current="active === tab.id ? 'true' : undefined"
        @click="goTo(tab.id)"
      >
        <span class="tr-tab__n">{{ index }}</span>:{{ tab.label }}<span v-if="active === tab.id" aria-hidden="true">*</span>
      </button>
    </nav>

    <span class="tr-header__right" aria-hidden="true"><i class="tr-blip"></i>online</span>
  </header>
</template>
