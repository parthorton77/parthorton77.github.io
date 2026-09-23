<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { experiences } from '../../data/experience'

/** Oldest first, so the log reads like a log: earliest event at the top. */
const entries = experiences.map((role, index) => ({
  ...role,
  level: ['BOOT', 'INIT', 'BUILD', 'SHIP', 'LIVE'][index] ?? 'INFO',
  pid: String(1000 + index * 7).padStart(4, '0')
}))

const seen = ref<number[]>([])
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(items => {
    items.forEach(item => {
      if (!item.isIntersecting) return
      const index = Number((item.target as HTMLElement).dataset.index)
      if (!seen.value.includes(index)) seen.value.push(index)
      observer?.unobserve(item.target)
    })
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 })

  document.querySelectorAll('.tr-entry').forEach(entry => observer?.observe(entry))
})

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <section id="journey" class="tr-section">
    <p class="tr-line tr-line--head">
      <span class="tr-prompt">parth@portfolio</span><span class="tr-sep">:</span><span class="tr-path">~</span><span class="tr-sep">$</span>
      <span class="tr-cmd">tail -f /var/log/career.log</span>
    </p>

    <h2 class="tr-heading">The career log</h2>
    <p class="tr-blurb">
      One continuous process since {{ entries[0].year.slice(0, 4) }}. Every line is a role; every restart taught it something new.
    </p>

    <div class="tr-entries">
      <article
        v-for="(entry, index) in entries"
        :key="entry.company"
        class="tr-entry"
        :class="[`is-${entry.level.toLowerCase()}`, { 'is-seen': seen.includes(index) }]"
        :data-index="index"
      >
        <div class="tr-entry__meta">
          <span class="tr-entry__year">{{ entry.year }}</span>
          <span class="tr-tag" :class="`lvl-${entry.level.toLowerCase()}`">{{ entry.level }}</span>
          <span class="tr-entry__pid">pid {{ entry.pid }}</span>
        </div>

        <div class="tr-entry__body">
          <h3>{{ entry.role }}</h3>
          <p class="tr-entry__company">
            <span aria-hidden="true">└─</span> {{ entry.company }}<span v-if="entry.project"> · {{ entry.project }}</span>
          </p>
          <p class="tr-entry__summary">{{ entry.summary }}</p>
          <p class="tr-entry__stack">
            <span class="tr-key">stack</span>[{{ entry.tech.join(', ') }}]
          </p>
        </div>
      </article>
    </div>
  </section>
</template>
