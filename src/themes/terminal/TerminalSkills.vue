<script setup lang="ts">
import { skillGroups, featuredSkills } from '../../data/skills'
import { skillCount } from './shell'

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const isFeatured = (item: string) => featuredSkills.includes(item)
</script>

<template>
  <section id="skills" class="tr-section">
    <p class="tr-line tr-line--head">
      <span class="tr-prompt">parth@portfolio</span><span class="tr-sep">:</span><span class="tr-path">~</span><span class="tr-sep">$</span>
      <span class="tr-cmd">tree /usr/lib/skills</span>
    </p>

    <h2 class="tr-heading">The skill tree</h2>
    <p class="tr-blurb">
      {{ skillCount }} entries in {{ skillGroups.length }} directories. Everything here has shipped something real.
    </p>

    <div class="tr-tree">
      <p class="tr-tree__root">/usr/lib/skills</p>

      <div
        v-for="(group, groupIndex) in skillGroups"
        :key="group.title"
        class="tr-tree__group"
        :class="{ 'is-last': groupIndex === skillGroups.length - 1 }"
      >
        <p class="tr-tree__dir">
          <span class="tr-tree__branch" aria-hidden="true">{{ groupIndex === skillGroups.length - 1 ? '└──' : '├──' }}</span>
          <span class="tr-tree__dirname">{{ slug(group.title) }}/</span>
          <span class="tr-tree__count">{{ group.items.length }} entries</span>
        </p>

        <ul class="tr-tree__files">
          <li
            v-for="(item, itemIndex) in group.items"
            :key="item"
            :class="{ 'is-featured': isFeatured(item) }"
          >
            <span class="tr-tree__branch" aria-hidden="true">{{ itemIndex === group.items.length - 1 ? '└──' : '├──' }}</span>
            <span class="tr-tree__mode">{{ isFeatured(item) ? '-rwxr-xr-x' : '-rw-r--r--' }}</span>
            <span class="tr-tree__file">{{ slug(item) }}</span>
            <span v-if="isFeatured(item)" class="tr-tree__note">← recently installed</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
