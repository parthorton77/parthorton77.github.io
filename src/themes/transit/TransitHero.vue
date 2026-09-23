<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { mapPath, mapStations } from './route'
import { yearsRunning, stationCount } from '../../data/career'

const reduced = ref(false)

const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})
</script>

<template>
  <section id="home" class="tm-section tm-hero">
    <div class="tm-hero__copy">
      <p class="tm-eyebrow"><i aria-hidden="true"></i>Network map · Edition 2026</p>

      <div class="tm-roundel tm-roundel--hero">
        <span class="tm-roundel__ring"></span>
        <span class="tm-roundel__bar">PARTH PATEL</span>
      </div>

      <h1 class="tm-hero__title">
        From designing<br />visuals to
        <span class="tm-underline">building<br />experiences.</span>
      </h1>

      <p class="tm-hero__note">
        A creative professional whose journey evolved from graphics and UI design into crafting responsive,
        interactive and reusable frontend experiences. {{ yearsRunning }} years, {{ stationCount }} stations, one continuous line.
      </p>

      <dl class="tm-status">
        <div>
          <dt>Service</dt>
          <dd><span class="tm-pulse" aria-hidden="true"></span>In service</dd>
        </div>
        <div>
          <dt>Operating as</dt>
          <dd>Senior UI Developer</dd>
        </div>
        <div>
          <dt>Current terminus</dt>
          <dd>AV Devs · CrossCountry Mortgage</dd>
        </div>
      </dl>

      <div class="tm-hero__actions">
        <button class="tm-btn tm-btn--solid" type="button" @click="goTo('journey')">Ride the line<span aria-hidden="true">↓</span></button>
        <button class="tm-btn" type="button" @click="goTo('projects')">View terminals</button>
      </div>
    </div>

    <figure class="tm-hero__map">
      <svg viewBox="0 0 420 300" role="img" aria-labelledby="tm-map-title">
        <title id="tm-map-title">Career route diagram from Cueserve in 2016 to AV Devs today</title>

        <defs>
          <linearGradient id="tm-route-grad" gradientUnits="userSpaceOnUse" x1="36" y1="46" x2="372" y2="216">
            <stop class="tm-g1" offset="0" />
            <stop class="tm-g2" offset="0.2" />
            <stop class="tm-g3" offset="0.48" />
            <stop class="tm-g4" offset="0.78" />
            <stop class="tm-g5" offset="1" />
          </linearGradient>
        </defs>

        <!-- every map needs a river -->
        <path class="tm-map__river" d="M0 258 C 90 236, 140 292, 232 268 S 372 246, 420 276" />

        <!-- other lines on the network, routed clear of the station labels -->
        <path class="tm-map__ghost" d="M20 206 H112 L162 256 H404" />
        <path class="tm-map__ghost" d="M344 16 V72 L398 126 V178" />
        <path class="tm-map__ghost" d="M14 104 H62 L102 144" />

        <path class="tm-map__casing" :d="mapPath" />
        <path class="tm-map__route" :d="mapPath" />

        <circle v-if="!reduced" class="tm-map__train" r="5.5">
          <animateMotion :path="mapPath" dur="11s" rotate="auto" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
        </circle>

        <g v-for="station in mapStations" :key="station.stop.company" :class="['tm-map__station', `is-${station.stop.line}`, { 'is-terminus': station.stop.kind === 'terminus' }]">
          <circle class="tm-map__dot" :cx="station.x" :cy="station.y" :r="station.stop.kind === 'terminus' ? 8 : 6" />
          <template v-if="station.place === 'stack'">
            <text class="tm-map__year" :x="station.x" :y="station.y - 15" text-anchor="middle">{{ station.stop.year.slice(0, 4) }}</text>
            <text class="tm-map__name" :x="station.x" :y="station.y + 22" text-anchor="middle">{{ station.stop.short }}</text>
          </template>
          <template v-else>
            <text class="tm-map__year" :x="station.x - 15" :y="station.y - 2" text-anchor="end">{{ station.stop.year.slice(0, 4) }}</text>
            <text class="tm-map__name" :x="station.x + 15" :y="station.y + 4" text-anchor="start">{{ station.stop.short }}</text>
          </template>
        </g>
      </svg>

      <figcaption>
        <span><b aria-hidden="true">◯</b> Origin</span>
        <span><b aria-hidden="true">●</b> Station</span>
        <span><b aria-hidden="true">◉</b> Terminus · current</span>
      </figcaption>
    </figure>

    <button class="tm-scroll-cue" type="button" @click="goTo('journey')">
      <span>Next station</span><i aria-hidden="true"></i>
    </button>
  </section>
</template>
