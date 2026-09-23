<script setup lang="ts">
import { projects } from '../data/projects'
</script>

<template>
  <section id="projects" class="projects section">
    <div class="section-heading">
      <p class="eyebrow">04 / SELECTED MISSIONS</p>
      <h2>WORK BUILT FOR<br /><em>THE REAL WORLD.</em></h2>
    </div>

    <div class="project-list">
      <article v-for="project in projects" :key="project.name" class="project-card">
        <div class="project-card__number">{{ project.number }}</div>
        <div class="project-card__orb"><span></span></div>
        <div class="project-card__content">
          <p>{{ project.category }}</p>
          <h3>{{ project.name }}</h3>
          <p class="project-card__description">{{ project.description }}</p>
          <div class="tech-list">
            <span v-for="tech in project.tech" :key="tech">{{ tech }}</span>
          </div>
        </div>
        <div class="project-card__arrow">↗</div>
      </article>
    </div>
  </section>
</template>