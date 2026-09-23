<script setup lang="ts">
import { skillGroups, featuredSkills } from '../../data/skills'
import type { LineToken } from './route'

const lineFor: Record<string, LineToken> = {
  Frontend: 'build',
  Frameworks: 'ship',
  Design: 'design',
  Workflow: 'craft'
}

const isFeatured = (item: string) => featuredSkills.includes(item)
</script>

<template>
  <section id="skills" class="tm-section tm-interchange">
    <header class="tm-head">
      <p class="tm-eyebrow"><i aria-hidden="true"></i>Interchange · connecting lines</p>
      <h2>Four lines meet<br /><span class="tm-underline">at this station.</span></h2>
      <p class="tm-head__note">
        Each line is a discipline, each stop a tool that earned its place by shipping something real.
      </p>
    </header>

    <div class="tm-lines">
      <article
        v-for="group in skillGroups"
        :key="group.title"
        class="tm-linegroup"
        :class="`is-${lineFor[group.title] ?? 'build'}`"
      >
        <div class="tm-linegroup__head">
          <span class="tm-line-chip">{{ group.title }}</span>
          <span class="tm-linegroup__count">{{ group.items.length }} stops</span>
        </div>

        <ol class="tm-rail">
          <li
            v-for="item in group.items"
            :key="item"
            class="tm-rail__stop"
            :class="{ 'is-featured': isFeatured(item) }"
          >
            <span class="tm-rail__dot" aria-hidden="true"></span>
            <span class="tm-rail__label">{{ item }}</span>
            <span v-if="isFeatured(item)" class="tm-rail__flag">New</span>
          </li>
        </ol>
      </article>
    </div>

    <p class="tm-interchange__note">Stations marked <b>New</b> opened most recently on this network.</p>
  </section>
</template>
