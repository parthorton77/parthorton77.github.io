<script setup lang="ts">
import { computed } from 'vue'
import { stops } from './route'
import { skillGroups } from '../../data/skills'
import { openedYear, yearsRunning } from '../../data/career'

const frameworkCount = skillGroups.find(group => group.title === 'Frameworks')?.items.length ?? 0

const plates = computed(() => [
  { value: String(yearsRunning), label: 'Years on the network', note: `Opened ${openedYear}` },
  { value: String(stops.length), label: 'Stations served', note: 'Graphics → UI development' },
  { value: String(frameworkCount), label: 'Modern frameworks', note: 'Vue · React' },
  { value: '∞', label: 'Curiosity to learn', note: 'No scheduled end' }
])

const progression = ['Graphics', 'UI / UX', 'Frontend', 'UI Development']
</script>

<template>
  <section id="stats" class="tm-section tm-board">
    <div class="tm-board__panel">
      <div class="tm-board__top">
        <span class="tm-board__title">Service information</span>
        <span class="tm-board__live"><i aria-hidden="true"></i>All lines running normally</span>
      </div>

      <div class="tm-board__grid">
        <div v-for="plate in plates" :key="plate.label" class="tm-plate">
          <strong>{{ plate.value }}</strong>
          <p class="tm-plate__label">{{ plate.label }}</p>
          <p class="tm-plate__note">{{ plate.note }}</p>
        </div>
      </div>

      <div class="tm-board__foot">
        <span class="tm-board__footlabel">Route taken</span>
        <ol class="tm-progression">
          <li v-for="step in progression" :key="step">
            <i aria-hidden="true"></i>{{ step }}
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
