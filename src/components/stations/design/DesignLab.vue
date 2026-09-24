<script setup lang="ts">
import { computed, ref } from 'vue'

type View = 'wire' | 'visual' | 'code'
type Breakpoint = 'desktop' | 'tablet' | 'mobile'

const view = ref<View>('visual')
const grid = ref(false)
const bp = ref<Breakpoint>('desktop')

const views: { id: View; label: string }[] = [
  { id: 'wire', label: 'Wireframe' },
  { id: 'visual', label: 'Visual' },
  { id: 'code', label: 'Code' },
]
const breakpoints: { id: Breakpoint; label: string; px: number; width: string }[] = [
  { id: 'desktop', label: 'Desktop', px: 1440, width: '100%' },
  { id: 'tablet', label: 'Tablet', px: 768, width: '70%' },
  { id: 'mobile', label: 'Mobile', px: 375, width: '46%' },
]
const current = computed(() => breakpoints.find((b) => b.id === bp.value)!)
</script>

<template>
  <div class="lab ui" :class="`lab--${view}`">
    <div class="lab__bar">
      <p class="lab__title"><span class="lab__dot" aria-hidden="true" />Design canvas · ArrivalCard.vue</p>
      <div class="lab__tools">
        <div class="seg" role="group" aria-label="Canvas view">
          <button v-for="v in views" :key="v.id" type="button" :aria-pressed="view === v.id" @click="view = v.id">
            {{ v.label }}
          </button>
        </div>
        <button class="pill" type="button" :aria-pressed="grid" :disabled="view === 'code'" @click="grid = !grid">Grid</button>
      </div>
    </div>

    <div class="lab__stage">
      <!-- Breakpoints resize the component preview; source code always gets the full width. -->
      <div class="lab__frame" :style="{ width: view === 'code' ? '100%' : current.width }">
        <div v-if="grid && view !== 'code'" class="lab__grid" aria-hidden="true"><i v-for="n in 12" :key="n" /></div>

        <article v-if="view !== 'code'" class="card" aria-label="Component specimen: arrival card">
          <div class="card__media" aria-hidden="true">
            <span v-if="view === 'wire'" class="note note--media">Media · 16:9</span>
          </div>
          <div class="card__body">
            <p class="card__meta">
              <span class="card__badge">DD</span>
              <span>Platform 02 · Arriving</span>
              <span v-if="view === 'wire'" class="note">Label · 12</span>
            </p>
            <p class="card__title">
              Design District
              <span v-if="view === 'wire'" class="note">Heading · 24</span>
            </p>
            <div class="card__progress" aria-hidden="true"><i /></div>
            <div class="card__actions">
              <span class="card__btn card__btn--primary">Board</span>
              <span class="card__btn">Details</span>
            </div>
          </div>
          <span v-if="view === 'wire'" class="spacer spacer--pad" aria-hidden="true">24</span>
          <span v-if="view === 'wire'" class="spacer spacer--gap" aria-hidden="true">16</span>
        </article>

        <pre v-else class="code" role="group" aria-label="Component source"><code v-pre><span class="c">&lt;!-- ArrivalCard.vue --&gt;</span>
<span class="t">&lt;article</span> <span class="a">class</span>=<span class="s">"card"</span><span class="t">&gt;</span>
  <span class="t">&lt;Media</span> <span class="a">:src</span>=<span class="s">"station.cover"</span> <span class="t">/&gt;</span>
  <span class="t">&lt;p</span> <span class="a">class</span>=<span class="s">"card__meta"</span><span class="t">&gt;</span>{{ station.platform }}<span class="t">&lt;/p&gt;</span>
  <span class="t">&lt;p</span> <span class="a">class</span>=<span class="s">"card__title"</span><span class="t">&gt;</span>{{ station.name }}<span class="t">&lt;/p&gt;</span>
  <span class="t">&lt;Progress</span> <span class="a">:value</span>=<span class="s">"eta"</span> <span class="t">/&gt;</span>
<span class="t">&lt;/article&gt;</span>

<span class="k">.card</span> {
  <span class="p">container-type</span>: inline-size;
  <span class="p">display</span>: grid;
  <span class="p">gap</span>: <span class="n">16px</span>;
  <span class="k">@container</span> (<span class="p">width</span> &gt; <span class="n">360px</span>) {
    <span class="p">grid-template-columns</span>: <span class="n">2fr 3fr</span>;
  }
}</code></pre>
      </div>
    </div>

    <div class="lab__foot">
      <div class="seg" role="group" aria-label="Breakpoint">
        <button v-for="b in breakpoints" :key="b.id" type="button" :aria-pressed="bp === b.id" @click="bp = b.id">
          {{ b.label }}
        </button>
      </div>
      <span class="lab__px" aria-live="polite">{{ current.px }} px viewport</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.lab {
  border: 1px solid var(--hair);
  border-radius: 16px;
  background: rgb(6 9 15 / 0.6);
  overflow: hidden;
}

.lab__bar,
.lab__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
}

.lab__bar {
  border-bottom: 1px solid var(--hair);
}

.lab__foot {
  border-top: 1px solid var(--hair);
}

.lab__title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-2);
  @include hud-label(0.625rem);
}

.lab__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--station);
}

.lab__tools {
  display: flex;
  gap: 8px;
}

.seg {
  display: inline-flex;
  padding: 3px;
  border: 1px solid var(--hair);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.02);

  button {
    @include reset-button;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    color: var(--text-3);
    font-size: 0.75rem;
    font-weight: 500;
    transition:
      background-color 0.2s,
      color 0.2s;

    &:hover {
      color: var(--text);
    }

    &[aria-pressed='true'] {
      background: color-mix(in srgb, var(--station) 20%, transparent);
      color: var(--text);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--station) 50%, transparent) inset;
    }
  }
}

.pill {
  @include reset-button;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--hair);
  border-radius: 999px;
  color: var(--text-3);
  font-size: 0.75rem;
  font-weight: 500;

  &[aria-pressed='true'] {
    border-color: color-mix(in srgb, var(--station) 60%, transparent);
    color: var(--text);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.lab__stage {
  display: grid;
  place-items: center;
  min-height: 250px;
  padding: 22px 16px;
  background:
    radial-gradient(circle at 1px 1px, rgb(150 172 210 / 0.12) 1px, transparent 0) 0 0 / 14px 14px,
    rgb(3 5 9 / 0.4);
}

.lab__frame {
  position: relative;
  container-type: inline-size;
  transition: width 0.55s var(--ease-out);
}

.lab__grid {
  position: absolute;
  inset: -6px 0;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 8px;
  pointer-events: none;

  i {
    background: color-mix(in srgb, var(--station) 14%, transparent);
    border-inline: 1px solid color-mix(in srgb, var(--station) 30%, transparent);
  }
}

// ---- The specimen ----
.card {
  position: relative;
  display: grid;
  gap: 16px;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, #151c2a, #0e131d);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.06) inset,
    0 20px 40px -20px rgb(0 0 0 / 0.8);
  transition:
    background 0.4s,
    box-shadow 0.4s;

  @container (width > 360px) {
    grid-template-columns: 2fr 3fr;
    align-items: center;
  }
}

.card__media {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  background:
    radial-gradient(circle at 70% 30%, rgb(255 255 255 / 0.35), transparent 30%),
    linear-gradient(135deg, var(--c-design), var(--c-projects));
  transition: background 0.4s;
}

.card__body {
  display: grid;
  gap: 10px;
}

.card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--text-3);
  @include hud-label(0.5625rem);
}

.card__badge {
  padding: 3px 6px;
  border-radius: 4px;
  background: var(--station);
  color: #1a0a0e;
  font-weight: 700;
}

.card__title {
  @include display(800);
  font-size: 1.15rem;
}

.card__progress {
  height: 4px;
  overflow: hidden;
  border-radius: 4px;
  background: rgb(255 255 255 / 0.08);

  i {
    display: block;
    width: 64%;
    height: 100%;
    border-radius: inherit;
    background: var(--station);
  }
}

.card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.card__btn {
  display: inline-grid;
  place-items: center;
  min-height: 32px;
  padding: 0 14px;
  border: 1px solid var(--hair-2);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.card__btn--primary {
  border-color: transparent;
  background: var(--station);
  color: #1a0a0e;
}

// ---- Wireframe treatment: same DOM, stripped to structure ----
.lab--wire {
  .card {
    background: transparent;
    box-shadow: 0 0 0 1px rgb(238 242 248 / 0.35) inset;
  }

  .card__media {
    background:
      linear-gradient(to top right, transparent calc(50% - 1px), rgb(238 242 248 / 0.3) 50%, transparent calc(50% + 1px)),
      linear-gradient(to top left, transparent calc(50% - 1px), rgb(238 242 248 / 0.3) 50%, transparent calc(50% + 1px));
    outline: 1px dashed rgb(238 242 248 / 0.4);
  }

  .card__title,
  .card__meta,
  .card__btn {
    color: rgb(238 242 248 / 0.55);
  }

  .card__badge,
  .card__btn--primary,
  .card__progress i {
    background: rgb(238 242 248 / 0.2);
    color: rgb(238 242 248 / 0.7);
  }

  .card__btn {
    border-style: dashed;
  }
}

.note {
  padding: 1px 5px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--station) 22%, transparent);
  color: var(--station);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.06em;
  text-transform: none;
  vertical-align: middle;
}

.note--media {
  position: absolute;
  left: 8px;
  top: 8px;
}

.spacer {
  position: absolute;
  color: var(--station);
  font-family: var(--font-mono);
  font-size: 0.5625rem;

  &::before {
    content: '';
    position: absolute;
    background: var(--station);
  }
}

.spacer--pad {
  top: -2px;
  right: 18px;

  &::before {
    right: -8px;
    top: 2px;
    width: 1px;
    height: 14px;
  }
}

.spacer--gap {
  bottom: 2px;
  left: 50%;
}

.code {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  border-radius: 12px;
  background: #080c14;
  box-shadow: 0 0 0 1px var(--hair) inset;
  color: var(--text-2);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  line-height: 1.7;
  white-space: pre;

  .c {
    color: var(--text-3);
  }
  .t {
    color: var(--c-design);
  }
  .a {
    color: var(--c-engineering);
  }
  .s {
    color: var(--c-career);
  }
  .k {
    color: var(--c-projects);
  }
  .p {
    color: var(--text);
  }
  .n {
    color: var(--signal);
  }
}

.lab__px {
  color: var(--text-3);
  @include hud-label(0.625rem);
}
</style>
