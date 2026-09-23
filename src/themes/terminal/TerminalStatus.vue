<script setup lang="ts">
import { experiences } from '../../data/experience'
import { skillGroups } from '../../data/skills'
import { openedYear, yearsRunning } from './shell'

const frameworks = skillGroups.find(group => group.title === 'Frameworks')?.items ?? []

const progression = ['graphics', 'ui-ux', 'frontend', 'ui-development']
</script>

<template>
  <section id="stats" class="tr-section">
    <p class="tr-line tr-line--head">
      <span class="tr-prompt">parth@portfolio</span><span class="tr-sep">:</span><span class="tr-path">~</span><span class="tr-sep">$</span>
      <span class="tr-cmd">systemctl status parth.service</span>
    </p>

    <div class="tr-status">
      <p class="tr-status__title">
        <span class="tr-live"><i aria-hidden="true"></i></span>
        <b>parth.service</b> — Senior UI Developer
      </p>

      <dl class="tr-status__rows">
        <div>
          <dt>Loaded</dt>
          <dd>loaded (<span class="tr-path-inline">/etc/career/parth.service</span>; <span class="tr-ok">enabled</span>)</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd><span class="tr-ok">active (running)</span> since {{ openedYear }}; {{ yearsRunning }} years ago</dd>
        </div>
        <div>
          <dt>Main PID</dt>
          <dd>{{ openedYear }} (frontend)</dd>
        </div>
        <div>
          <dt>Restarts</dt>
          <dd>{{ experiences.length }} <span class="tr-dim">(every one on purpose)</span></dd>
        </div>
        <div>
          <dt>Runtimes</dt>
          <dd>{{ frameworks.length }} <span class="tr-dim">({{ frameworks.join(', ') }})</span></dd>
        </div>
        <div>
          <dt>Memory</dt>
          <dd><span class="tr-accent">∞</span> <span class="tr-dim">curiosity, no scheduled end</span></dd>
        </div>
      </dl>

      <div class="tr-cgroup">
        <p class="tr-cgroup__label">CGroup</p>
        <ul>
          <li v-for="(step, index) in progression" :key="step">
            <span aria-hidden="true">{{ index === progression.length - 1 ? '└─' : '├─' }}</span>
            <span class="tr-cgroup__name" :class="{ 'is-current': index === progression.length - 1 }">{{ step }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
