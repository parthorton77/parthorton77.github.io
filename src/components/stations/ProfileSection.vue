<script setup lang="ts">
import StationSection from './StationSection.vue'
import StationSign from '@/components/ui/StationSign.vue'
import { CAREER_START_YEAR, currentRole, person, roles, skillGroups, yearsOfExperience } from '@/data/portfolio'

const frameworks = skillGroups.find((g) => g.id === 'frameworks')?.items ?? []
const readouts = [
  { value: String(yearsOfExperience), unit: 'yrs', label: 'On the network', note: `Since ${CAREER_START_YEAR}` },
  { value: String(roles.length), unit: '', label: 'Roles served', note: 'Graphics → UI development' },
  { value: String(frameworks.length), unit: '', label: 'Modern frameworks', note: frameworks.join(' · ') },
]
</script>

<template>
  <StationSection id="profile" side="left" v-slot="{ station }">
    <div class="station__panel profile">
      <StationSign :station="station" heading-id="profile-title">{{ person.intro }}</StationSign>

      <article class="terminal" aria-labelledby="passenger-name">
        <header class="terminal__bar">
          <span>Passenger profile</span>
          <span class="terminal__id">Terminal PC-01</span>
          <span class="terminal__live"><i aria-hidden="true" />In service</span>
        </header>

        <div class="terminal__id-row">
          <div class="badge" aria-hidden="true">
            <span class="badge__ring" />
            <span class="badge__mono">PP</span>
          </div>
          <dl class="fields">
            <div>
              <dt>Passenger</dt>
              <dd id="passenger-name">{{ person.name }}</dd>
            </div>
            <div>
              <dt>Class</dt>
              <dd>{{ person.title }}</dd>
            </div>
            <div>
              <dt>On the network since</dt>
              <dd>{{ CAREER_START_YEAR }} · {{ yearsOfExperience }} years</dd>
            </div>
            <div>
              <dt>Current service</dt>
              <dd>{{ currentRole.company }} · {{ currentRole.project }}</dd>
            </div>
          </dl>
        </div>

        <p class="terminal__summary">{{ person.summary }}</p>

        <div class="route" role="group" aria-label="Career route">
          <p class="route__label">Route taken</p>
          <ol class="route__line">
            <li v-for="(stop, i) in person.route" :key="stop" :class="{ 'is-current': i === person.route.length - 1 }">
              <span class="route__node" aria-hidden="true" />
              <span class="route__name">{{ stop }}</span>
            </li>
          </ol>
        </div>

        <dl class="readouts">
          <div v-for="r in readouts" :key="r.label" class="readout">
            <dt>{{ r.label }}</dt>
            <dd>
              <strong>{{ r.value }}<small v-if="r.unit">{{ r.unit }}</small></strong>
              <span>{{ r.note }}</span>
            </dd>
          </div>
        </dl>

        <div class="domains">
          <p class="domains__label">Domains served</p>
          <ul class="domains__list">
            <li v-for="d in person.domains" :key="d" class="chip">{{ d }}</li>
          </ul>
        </div>
      </article>
    </div>
  </StationSection>
</template>

<style scoped lang="scss">
.profile {
  display: grid;
  gap: 26px;
}

.terminal {
  display: grid;
  gap: 18px;
  padding: 18px;
  border: 1px solid var(--hair);
  border-radius: 16px;
  background: linear-gradient(180deg, rgb(255 181 71 / 0.05), transparent 38%), rgb(6 9 15 / 0.55);
}

.terminal__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--hair-2);
  color: var(--text-3);
  @include hud-label(0.625rem);
}

.terminal__id {
  color: var(--text-2);
}

.terminal__live {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
  color: var(--go);

  i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 10px currentColor;
  }
}

.terminal__id-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  align-items: center;

  @include down(sm) {
    grid-template-columns: 1fr;
  }
}

.badge {
  position: relative;
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
}

.badge__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    conic-gradient(from 210deg, var(--station), transparent 30%, var(--station) 55%, transparent 80%, var(--station)),
    var(--deep);
  mask: radial-gradient(circle, transparent 58%, #000 60%, #000 64%, transparent 66%, transparent 74%, #000 76%);
  animation: badge-spin 18s linear infinite;
}

@keyframes badge-spin {
  to {
    transform: rotate(1turn);
  }
}

.badge__mono {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgb(255 181 71 / 0.35), rgb(255 181 71 / 0.05) 70%);
  box-shadow: 0 0 0 1px rgb(255 181 71 / 0.35) inset;
  color: var(--station);
  @include display(800);
  font-size: 1.1rem;
}

.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;

  @include down(sm) {
    grid-template-columns: 1fr;
  }

  dt {
    margin-bottom: 3px;
    color: var(--text-3);
    @include hud-label(0.625rem);
  }

  dd {
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1.35;
  }
}

.terminal__summary {
  color: var(--text-2);
  font-size: 0.95rem;
  line-height: 1.65;
}

.route__label,
.domains__label {
  margin-bottom: 10px;
  color: var(--text-3);
  @include hud-label(0.625rem);
}

.route__line {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: calc(25% - 6px);
    height: 2px;
    background: linear-gradient(90deg, var(--c-design), var(--c-projects), var(--c-engineering), var(--station));
    opacity: 0.7;
  }

  li {
    position: relative;
    display: grid;
    gap: 8px;
  }
}

.route__node {
  width: 14px;
  height: 14px;
  border: 2px solid var(--text-2);
  border-radius: 50%;
  background: var(--deep);

  .is-current & {
    border-color: var(--station);
    background: var(--station);
    box-shadow: 0 0 0 4px rgb(255 181 71 / 0.18);
  }
}

.route__name {
  color: var(--text-2);
  font-size: 0.8125rem;
  font-weight: 500;

  .is-current & {
    color: var(--text);
  }
}

.readouts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-block: 1px solid var(--hair);

  @include down(sm) {
    grid-template-columns: 1fr;
  }
}

.readout {
  display: grid;
  gap: 4px;
  padding: 12px 14px 12px 0;

  & + & {
    padding-left: 14px;
    border-left: 1px solid var(--hair);

    @include down(sm) {
      padding-left: 0;
      border-left: 0;
      border-top: 1px solid var(--hair);
    }
  }

  dt {
    color: var(--text-3);
    @include hud-label(0.625rem);
  }

  dd {
    display: grid;
    gap: 2px;
  }

  strong {
    @include display(800);
    font-size: 1.9rem;
    line-height: 1;

    small {
      margin-left: 4px;
      color: var(--station);
      font-size: 0.7rem;
      letter-spacing: 0.1em;
    }
  }

  span {
    color: var(--text-3);
    font-size: 0.75rem;
  }
}

.domains__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
