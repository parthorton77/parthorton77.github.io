<script setup lang="ts">
import { projects } from '../../data/projects'
import type { LineToken } from './route'

const lines: LineToken[] = ['now', 'craft', 'ship']
</script>

<template>
  <section id="projects" class="tm-section tm-terminals">
    <header class="tm-head">
      <p class="tm-eyebrow"><i aria-hidden="true"></i>Terminals · where the line ends up</p>
      <h2>Three platforms,<br /><span class="tm-underline">three destinations.</span></h2>
      <p class="tm-head__note">
        Work that carried real traffic — financial services, commerce and education, each with its own set of connections.
      </p>
    </header>

    <div class="tm-platforms">
      <article
        v-for="(project, index) in projects"
        :key="project.name"
        class="tm-platform"
        :class="`is-${lines[index % lines.length]}`"
      >
        <span class="tm-platform__stripe" aria-hidden="true"></span>

        <div class="tm-platform__head">
          <span class="tm-platform__number">Platform {{ project.number }}</span>
          <span class="tm-line-chip">{{ project.category }}</span>
        </div>

        <h3>{{ project.name }}</h3>
        <p class="tm-platform__desc">{{ project.description }}</p>

        <div class="tm-platform__connections">
          <span class="tm-conn-label">Connections</span>
          <ul>
            <li v-for="item in project.tech" :key="item">{{ item }}</li>
          </ul>
        </div>

        <p class="tm-platform__foot"><i aria-hidden="true"></i>This service terminates here</p>
      </article>
    </div>
  </section>
</template>
