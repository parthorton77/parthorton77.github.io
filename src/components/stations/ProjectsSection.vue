<script setup lang="ts">
import StationSection from './StationSection.vue'
import StationSign from '@/components/ui/StationSign.vue'
import ProjectExhibit from './projects/ProjectExhibit.vue'
import { projects } from '@/data/portfolio'
</script>

<template>
  <StationSection id="projects" side="left" v-slot="{ station, lite }">
    <div class="station__panel projects">
      <StationSign :station="station" heading-id="projects-title">
        Three exhibits from real work — financial services, commerce and education. Select one to step inside{{
          lite ? '' : ', or point at its hologram in the gallery'
        }}.
      </StationSign>
      <ul class="projects__list" aria-label="Exhibits">
        <li v-for="p in projects" :key="p.id"><ProjectExhibit :project="p" /></li>
      </ul>
    </div>
  </StationSection>
</template>

<style scoped lang="scss">
.projects {
  display: grid;
  gap: 22px;
}

.projects__list {
  display: grid;
  gap: 12px;
}
</style>
