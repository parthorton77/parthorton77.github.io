<script setup lang="ts">
import StationSection from './StationSection.vue'
import StationSign from '@/components/ui/StationSign.vue'
import DesignLab from './design/DesignLab.vue'
import { roles, skillGroups } from '@/data/portfolio'

// The design-led roles, straight from the résumé.
const roots = roles.slice(0, 3).map((r) => ({ year: r.start, company: r.company, text: r.highlights[0] }))
const tools = skillGroups.find((g) => g.id === 'design')?.items ?? []
const disciplines = ['Graphics', 'UI design', 'UX', 'Visual design', 'Responsive design', 'Design systems', 'Components']
</script>

<template>
  <StationSection id="design" side="right" v-slot="{ station }">
    <div class="station__panel design">
      <StationSign :station="station" heading-id="design-title">
        Where the line began. Graphics and interface design came first — the visual judgment behind every component
        built since.
      </StationSign>

      <DesignLab />

      <div class="design__cols">
        <section class="roots" aria-labelledby="design-roots">
          <h3 id="design-roots" class="label">Design roots</h3>
          <ol>
            <li v-for="r in roots" :key="r.company">
              <span class="roots__year">{{ r.year }}</span>
              <span class="roots__text"
                ><strong>{{ r.company }}</strong> {{ r.text }}</span
              >
            </li>
          </ol>
        </section>

        <section class="kit" aria-labelledby="design-kit">
          <h3 id="design-kit" class="label">Disciplines</h3>
          <ul class="kit__list">
            <li v-for="d in disciplines" :key="d" class="chip">{{ d }}</li>
          </ul>
          <h3 class="label label--gap">Design line · résumé</h3>
          <ul class="kit__list">
            <li v-for="t in tools" :key="t" class="chip chip--tool">{{ t }}</li>
          </ul>
        </section>
      </div>
    </div>
  </StationSection>
</template>

<style scoped lang="scss">
.design {
  display: grid;
  gap: 22px;
}

.design__cols {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 22px;

  @include down(sm) {
    grid-template-columns: 1fr;
  }
}

.label {
  margin-bottom: 10px;
  color: var(--text-3);
  @include hud-label(0.625rem);
}

.label--gap {
  margin-top: 16px;
}

.roots ol {
  display: grid;
  gap: 10px;
}

.roots li {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 10px;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.roots__year {
  color: var(--station);
  font-family: var(--font-mono);
  font-weight: 500;
}

.roots__text {
  color: var(--text-2);

  strong {
    display: block;
    color: var(--text);
    font-weight: 600;
  }
}

.kit__list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip--tool {
  border-color: color-mix(in srgb, var(--station) 40%, transparent);
  color: var(--text);
}
</style>
