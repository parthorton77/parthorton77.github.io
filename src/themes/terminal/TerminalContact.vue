<script setup lang="ts">
import { openedYear } from './shell'
</script>

<template>
  <section id="contact" class="tr-section tr-contact">
    <p class="tr-line tr-line--head">
      <span class="tr-prompt">parth@portfolio</span><span class="tr-sep">:</span><span class="tr-path">~</span><span class="tr-sep">$</span>
      <span class="tr-cmd">mail -s "Let's build something" parthorton@yahoo.com</span>
    </p>

    <h2 class="tr-heading">Awaiting input</h2>
    <p class="tr-blurb">
      Let's build interfaces and experiences that look good, work well and make an impact.
    </p>

    <div class="tr-window tr-window--compact">
      <div class="tr-window__bar">
        <span class="tr-window__dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="tr-window__title">compose</span>
      </div>
      <div class="tr-window__body">
        <p class="tr-field"><span class="tr-key">To</span>parthorton@yahoo.com</p>
        <p class="tr-field"><span class="tr-key">From</span>you@somewhere.good</p>
        <p class="tr-field"><span class="tr-key">Since</span>{{ openedYear }} — still accepting connections</p>

        <div class="tr-actions">
          <a class="tr-btn tr-btn--solid" href="mailto:parthorton@yahoo.com">
            <span aria-hidden="true">▸</span> send message
          </a>
          <a class="tr-btn" href="/Parth-Patel-Resume.pdf" download="Parth-Patel-Resume.pdf">
            <svg class="tr-btn__icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 1.9v8.3" />
              <path d="M4.5 6.9 8 10.4l3.5-3.5" />
              <path d="M2.4 11.9v1.3c0 .5.4.9.9.9h9.4c.5 0 .9-.4.9-.9v-1.3" />
            </svg>
            download resume
          </a>
          <a class="tr-btn" href="https://www.linkedin.com/in/parth-patel-471235183/" target="_blank" rel="noreferrer">
            linkedin
          </a>
        </div>
      </div>
    </div>

    <footer class="tr-footer">
      <span>parth patel · senior ui developer</span>
      <span>built with vue + scss<i class="tr-caret" aria-hidden="true"></i></span>
    </footer>
  </section>
</template>
