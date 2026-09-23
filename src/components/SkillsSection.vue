<script setup lang="ts">
import { skillGroups, featuredSkills } from '../data/skills'
</script>

<template>
  <section id="skills" class="skills section">
    <div class="section-heading section-heading--center">
      <p class="eyebrow">03 / TECH ARSENAL</p>
      <h2>TOOLS I USE TO<br /><em>BUILD THE EXPERIENCE.</em></h2>
    </div>

    <div class="skill-grid">
      <article v-for="(group, index) in skillGroups" :key="group.title" class="skill-card">
        <span class="skill-card__number">0{{ index + 1 }}</span>
        <h3>{{ group.title }}</h3>
        <div class="skill-card__items">
          <span v-for="skill in group.items" :key="skill" :class="{ 'is-featured': featuredSkills.includes(skill) }">{{ skill }}</span>
        </div>
      </article>
    </div>
  </section>
</template>