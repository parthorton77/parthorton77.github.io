<script setup lang="ts">
import { ref } from 'vue'
import StationSection from './StationSection.vue'
import StationSign from '@/components/ui/StationSign.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { goToStation } from '@/state/navigation'
import { contact, person } from '@/data/portfolio'

const copied = ref(false)
let timer = 0

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(contact.email)
  } catch {
    // Clipboard can be blocked (permissions, insecure context) — fall back to a selection copy.
    const el = document.createElement('textarea')
    el.value = contact.email
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    el.remove()
  }
  copied.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => (copied.value = false), 2200)
}

const year = new Date().getFullYear()
</script>

<template>
  <StationSection id="contact" side="left" v-slot="{ station }">
    <div class="station__panel final">
      <StationSign :station="station" heading-id="contact-title" />
      <p class="final__headline">Let's build something great.</p>
      <p class="final__lede">{{ person.closing }}</p>

      <ul class="links">
        <li class="link link--primary">
          <a class="link__main" :href="`mailto:${contact.email}`">
            <span class="link__icon"><AppIcon name="mail" /></span>
            <span class="link__text">
              <span class="link__label">Email</span>
              <span class="link__value">{{ contact.email }}</span>
            </span>
          </a>
          <button type="button" class="link__copy" :aria-label="copied ? 'Email address copied' : 'Copy email address'" @click="copyEmail">
            <AppIcon :name="copied ? 'check' : 'copy'" :size="18" />
          </button>
          <span class="sr-only" aria-live="polite">{{ copied ? 'Email address copied to clipboard' : '' }}</span>
        </li>
        <li class="link">
          <a class="link__main" :href="contact.linkedin" target="_blank" rel="noopener">
            <span class="link__icon"><AppIcon name="linkedin" :size="18" /></span>
            <span class="link__text">
              <span class="link__label">LinkedIn</span>
              <span class="link__value">{{ contact.linkedinLabel }}</span>
            </span>
            <AppIcon class="link__go" name="external" :size="16" />
          </a>
        </li>
        <li class="link">
          <a class="link__main" :href="contact.github" target="_blank" rel="noopener">
            <span class="link__icon"><AppIcon name="github" :size="18" /></span>
            <span class="link__text">
              <span class="link__label">GitHub</span>
              <span class="link__value">{{ contact.githubLabel }}</span>
            </span>
            <AppIcon class="link__go" name="external" :size="16" />
          </a>
        </li>
        <li class="link">
          <a class="link__main" :href="contact.resume" target="_blank" rel="noopener">
            <span class="link__icon"><AppIcon name="file" /></span>
            <span class="link__text">
              <span class="link__label">Resume</span>
              <span class="link__value">View PDF</span>
            </span>
            <AppIcon class="link__go" name="external" :size="16" />
          </a>
          <a class="link__copy" :href="contact.resume" download="Parth-Patel-Resume.pdf" aria-label="Download resume PDF">
            <AppIcon name="download" :size="18" />
          </a>
        </li>
      </ul>

      <footer class="colophon">
        <p>© {{ year }} {{ person.name }} · {{ person.title }}</p>
        <button type="button" class="colophon__back" @click="goToStation('landing')">
          <AppIcon name="arrow-up" :size="16" /> Return to Platform 0
        </button>
      </footer>
    </div>
  </StationSection>
</template>

<style scoped lang="scss">
.final {
  display: grid;
  gap: 18px;
}

.final__headline {
  @include display(800);
  font-size: clamp(2rem, 1.2rem + 3vw, 3.6rem);
  line-height: 0.98;
  text-wrap: balance;
  background: linear-gradient(100deg, #fff 30%, var(--signal) 120%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.final__lede {
  max-width: 46ch;
  color: var(--text-2);
  font-size: 1.02rem;
  line-height: 1.6;
}

.links {
  display: grid;
  gap: 8px;
  margin-top: 6px;
}

.link {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid var(--hair);
  border-radius: 14px;
  background: rgb(255 255 255 / 0.025);
  transition:
    border-color 0.2s,
    background-color 0.2s;

  &:hover,
  &:focus-within {
    border-color: var(--hair-2);
    background: rgb(255 255 255 / 0.045);
  }
}

.link--primary {
  border-color: rgb(255 181 71 / 0.45);
  background: rgb(255 181 71 / 0.07);

  &:hover,
  &:focus-within {
    border-color: rgb(255 181 71 / 0.75);
    background: rgb(255 181 71 / 0.11);
  }

  .link__icon {
    background: var(--signal);
    color: var(--signal-ink);
  }
}

.link__main {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 14px;
  min-width: 0;
  min-height: 60px;
  padding: 10px 14px;
  border-radius: 14px;
}

.link__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.06);
  color: var(--text);
}

.link__text {
  display: grid;
  min-width: 0;
}

.link__label {
  color: var(--text-3);
  @include hud-label(0.5625rem);
}

.link__value {
  overflow: hidden;
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link__go {
  margin-left: auto;
  color: var(--text-3);
}

.link__copy {
  @include reset-button;
  display: grid;
  flex: none;
  place-items: center;
  width: 56px;
  border-left: 1px solid var(--hair);
  color: var(--text-2);

  &:hover {
    color: var(--text);
    background: rgb(255 255 255 / 0.04);
  }
}

.colophon {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 18px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--hair);
  color: var(--text-3);
  font-size: 0.75rem;
}

.colophon__back {
  @include reset-button;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  margin-left: auto;
  padding: 0 12px;
  border: 1px solid var(--hair);
  border-radius: 999px;
  color: var(--text-2);
  font-size: 0.75rem;

  &:hover {
    color: var(--text);
  }
}
</style>
