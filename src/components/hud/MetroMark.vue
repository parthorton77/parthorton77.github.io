<template>
  <svg class="mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <rect width="64" height="64" rx="16" class="mark__bg" />
    <path class="mark__line" d="M23 49V15h11.5a10.5 10.5 0 0 1 0 21H23" />
    <circle class="mark__stop" cx="23" cy="49" r="5.5" />
  </svg>
</template>

<style scoped lang="scss">
.mark {
  width: 34px;
  height: 34px;
}

.mark__bg {
  fill: #0d121d;
  stroke: var(--hair-2);
  stroke-width: 1.5;
}

.mark__line {
  fill: none;
  stroke: var(--signal);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mark__stop {
  fill: #0d121d;
  stroke: var(--text);
  stroke-width: 3.2;
}
</style>
