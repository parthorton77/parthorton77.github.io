<script setup lang="ts">
import { stops } from './route'

const openedYear = stops[0]?.year.slice(0, 4) ?? '2016'
</script>

<template>
  <section id="contact" class="tm-section tm-end">
    <header class="tm-head tm-head--center">
      <p class="tm-eyebrow"><i aria-hidden="true"></i>End of line · all change</p>
      <h2>This service<br /><span class="tm-underline">terminates here.</span></h2>
      <p class="tm-head__note">
        Let's build interfaces and experiences that look good, work well and make an impact.
        The next line hasn't been drawn yet.
      </p>
    </header>

    <div class="tm-ticket">
      <div class="tm-ticket__stub">
        <span class="tm-ticket__stublabel">Single</span>
        <strong>PP</strong>
        <span class="tm-ticket__stubfoot">Any route</span>
      </div>

      <div class="tm-ticket__body">
        <dl class="tm-ticket__row">
          <div><dt>Passenger</dt><dd>Parth Patel</dd></div>
          <div><dt>Class</dt><dd>Senior UI Developer</dd></div>
        </dl>
        <dl class="tm-ticket__row">
          <div><dt>Valid from</dt><dd>{{ openedYear }}</dd></div>
          <div><dt>Valid until</dt><dd>Further notice</dd></div>
        </dl>

        <div class="tm-ticket__actions">
          <a class="tm-btn tm-btn--solid" href="mailto:parthorton@yahoo.com">Start a conversation<span aria-hidden="true">↗</span></a>
          <a class="tm-btn" href="/Parth-Patel-Resume.pdf" download="Parth-Patel-Resume.pdf">
            <svg class="tm-btn__icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 1.9v8.3" />
              <path d="M4.5 6.9 8 10.4l3.5-3.5" />
              <path d="M2.4 11.9v1.3c0 .5.4.9.9.9h9.4c.5 0 .9-.4.9-.9v-1.3" />
            </svg>
            Download resume
          </a>
          <a class="tm-btn" href="https://www.linkedin.com/in/parth-patel-471235183/" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
      </div>
    </div>

    <footer class="tm-legend">
      <div class="tm-legend__keys">
        <span><i class="tm-key tm-key--origin" aria-hidden="true"></i>Origin station</span>
        <span><i class="tm-key tm-key--stop" aria-hidden="true"></i>Station</span>
        <span><i class="tm-key tm-key--terminus" aria-hidden="true"></i>Terminus</span>
        <span><i class="tm-key tm-key--conn" aria-hidden="true"></i>Interchange</span>
      </div>
      <div class="tm-legend__meta">
        <span>Parth Patel · UI Developer</span>
        <span>Designed &amp; built with Vue + SCSS</span>
      </div>
    </footer>
  </section>
</template>
