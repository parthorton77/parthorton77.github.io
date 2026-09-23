<script setup lang="ts">
import AppHeader from '../components/AppHeader.vue'
import SpaceBackground from '../components/SpaceBackground.vue'
import HeroSection from '../components/HeroSection.vue'
import JourneySection from '../components/JourneySection.vue'
import SkillsSection from '../components/SkillsSection.vue'
import StatsSection from '../components/StatsSection.vue'
import ProjectsSection from '../components/ProjectsSection.vue'
import ContactSection from '../components/ContactSection.vue'
</script>

<template>
  <div class="app-shell">
    <SpaceBackground />
    <AppHeader />
    <main>
      <HeroSection />
      <JourneySection />
      <SkillsSection />
      <StatsSection />
      <ProjectsSection />
      <ContactSection />
    </main>
  </div>
</template>
