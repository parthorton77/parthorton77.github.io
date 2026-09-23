<script setup lang="ts">
import { experiences } from '../data/experience'
</script>

<template>
  <section id="journey" class="journey section">
    <div class="section-heading">
      <p class="eyebrow">02 / CAREER TRAJECTORY</p>
      <h2>FROM THE <em>FIRST PIXEL</em><br />TO THE NEXT <em>MISSION.</em></h2>
      <p>Every role added another layer: visual thinking, interface design, responsive development and modern frontend engineering.</p>
    </div>

    <div class="timeline">
      <div v-for="(experience, index) in experiences" :key="experience.company + experience.role" class="timeline-item">
        <div class="timeline-item__year">{{ experience.year }}</div>
        <div class="timeline-item__node"><span>{{ String(index + 1).padStart(2, '0') }}</span></div>
        <article class="timeline-card">
          <p v-if="experience.project" class="project-tag">{{ experience.project }}</p>
          <h3>{{ experience.role }}</h3>
          <h4>{{ experience.company }}</h4>
          <p>{{ experience.summary }}</p>
          <div class="tech-list">
            <span v-for="tech in experience.tech" :key="tech">{{ tech }}</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>