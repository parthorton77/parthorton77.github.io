<script setup lang="ts">
import { defineAsyncComponent, onMounted } from 'vue'
import MetroHeader from '@/components/hud/MetroHeader.vue'
import MetroMap from '@/components/hud/MetroMap.vue'
import MapOverlay from '@/components/hud/MapOverlay.vue'
import StationCue from '@/components/hud/StationCue.vue'
import TransferOverlay from '@/components/hud/TransferOverlay.vue'
import CinemaBars from '@/components/hud/CinemaBars.vue'
import LandingSection from '@/components/stations/LandingSection.vue'
import ProfileSection from '@/components/stations/ProfileSection.vue'
import DesignSection from '@/components/stations/DesignSection.vue'
import EngineeringSection from '@/components/stations/EngineeringSection.vue'
import ProjectsSection from '@/components/stations/ProjectsSection.vue'
import CareerSection from '@/components/stations/CareerSection.vue'
import AiLabSection from '@/components/stations/AiLabSection.vue'
import ContactSection from '@/components/stations/ContactSection.vue'
import ProjectDialog from '@/components/stations/ProjectDialog.vue'
import { app } from '@/state/app'
import { startJourney } from '@/state/journey'
import { useHashSync } from '@/composables/useHashSync'

// three.js only downloads when the 3D world is actually used.
const WorldCanvas = defineAsyncComponent(() => import('@/components/world/WorldCanvas.vue'))

useHashSync()

onMounted(() => {
  startJourney()
})
</script>

<template>
  <div class="app" :class="[`mode-${app.mode}`, { 'is-cinematic': app.cinematic, 'has-dossier': !!app.projectOpen }]">
    <a class="skip-link" href="#main">Skip to content</a>

    <WorldCanvas v-if="app.mode === '3d'" />
    <div class="grain" aria-hidden="true" />

    <MetroHeader />
    <MetroMap />
    <MapOverlay />

    <main id="main" tabindex="-1">
      <LandingSection />
      <ProfileSection />
      <DesignSection />
      <EngineeringSection />
      <ProjectsSection />
      <CareerSection />
      <AiLabSection />
      <ContactSection />
    </main>

    <StationCue />
    <ProjectDialog />
    <TransferOverlay />
    <CinemaBars />
  </div>
</template>

<style lang="scss">
.app {
  position: relative;
  isolation: isolate;
}

main {
  position: relative;
  z-index: 2;
}

// While an exhibit dossier is open in 3D, the gallery is the backdrop — tuck the station panel away.
.mode-3d .station--projects .station__panel {
  transition:
    opacity 0.35s var(--ease-out),
    transform 0.45s var(--ease-out);
}

.mode-3d.has-dossier .station--projects .station__panel {
  opacity: 0;
  transform: translateX(-24px);
}

// A whisper of film grain over everything — static, so it costs nothing per frame.
.grain {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  opacity: 0.06;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
</style>
