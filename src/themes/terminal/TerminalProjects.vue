<script setup lang="ts">
import { projects } from '../../data/projects'

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
</script>

<template>
  <section id="projects" class="tr-section">
    <p class="tr-line tr-line--head">
      <span class="tr-prompt">parth@portfolio</span><span class="tr-sep">:</span><span class="tr-path">~</span><span class="tr-sep">$</span>
      <span class="tr-cmd">ls -1 ~/projects &amp;&amp; cat ~/projects/*/README.md</span>
    </p>

    <h2 class="tr-heading">Shipped targets</h2>
    <p class="tr-blurb">
      {{ projects.length }} builds that carried real traffic — financial services, commerce and education.
    </p>

    <div class="tr-files">
      <article v-for="project in projects" :key="project.name" class="tr-file">
        <div class="tr-file__bar">
          <span class="tr-file__path">~/projects/{{ slug(project.name) }}/README.md</span>
          <span class="tr-file__num">{{ project.number }}</span>
        </div>

        <div class="tr-file__body">
          <h3><span class="tr-hash" aria-hidden="true">#</span> {{ project.name }}</h3>
          <p class="tr-file__tag">&gt; {{ project.category }}</p>
          <p class="tr-file__desc">{{ project.description }}</p>
          <ul class="tr-file__deps">
            <li class="tr-key">deps</li>
            <li v-for="item in project.tech" :key="item">{{ item }}</li>
          </ul>
        </div>
      </article>
    </div>
  </section>
</template>
