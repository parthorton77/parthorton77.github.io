<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const sphere = ref<HTMLElement | null>(null)

const moveSphere = (event: MouseEvent) => {
  if (!sphere.value || window.matchMedia('(pointer: coarse)').matches) return
  const x = (event.clientX / window.innerWidth - 0.5) * 14
  const y = (event.clientY / window.innerHeight - 0.5) * 14
  sphere.value.style.setProperty('--mx', `${x}px`)
  sphere.value.style.setProperty('--my', `${y}px`)
}

const leaveSphere = () => {
  sphere.value?.style.setProperty('--mx', '0px')
  sphere.value?.style.setProperty('--my', '0px')
}

const scrollToJourney = () => document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' })
const scrollToProjects = () => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })

onMounted(() => {
  window.addEventListener('mousemove', moveSphere, { passive: true })
  window.addEventListener('mouseleave', leaveSphere)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', moveSphere)
  window.removeEventListener('mouseleave', leaveSphere)
})
</script>

<template>
  <section id="home" class="hero section">
    <div class="hero__copy">
      <p class="eyebrow">01 / PROFESSIONAL UNIVERSE</p>
      <p class="availability"><span></span> SENIOR UI DEVELOPER</p>
      <h1>PARTH <em>PATEL</em></h1>
      <p class="hero__statement">FROM DESIGNING VISUALS<br />TO <strong>BUILDING EXPERIENCES.</strong></p>
      <p class="hero__description">
        A creative professional whose journey evolved from graphics and UI design into crafting responsive,
        interactive and reusable frontend experiences.
      </p>
      <div class="hero__actions">
        <button class="button button--primary" type="button" @click="scrollToJourney">Explore My Journey <span>↘</span></button>
        <button class="button button--ghost" type="button" @click="scrollToProjects">View Projects</button>
      </div>
    </div>

    <div class="hero__visual">
      <div ref="sphere" class="orbit-system">
        <div class="orbit orbit--one"></div>
        <div class="orbit orbit--two"></div>
        <div class="sphere">
          <div class="sphere__seam"></div>
          <div class="sphere__shine"></div>
          <span class="sphere__label">PP / 01</span>
        </div>
        <span class="satellite satellite--one"></span>
        <span class="satellite satellite--two"></span>
      </div>
    </div>

    <button class="scroll-cue" type="button" @click="scrollToJourney">
      <span>SCROLL TO EXPLORE</span><i></i>
    </button>
  </section>
</template>