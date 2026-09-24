import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Relative base so the build works from a GitHub Pages user site or any sub-path.
  base: './',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: {
    preprocessorOptions: {
      // Abstracts emit no CSS — only tokens, functions and mixins — so injecting them is free.
      scss: { additionalData: `@use "@/styles/abstracts" as *;\n` },
    },
  },
  build: {
    target: 'es2022',
    // three.js is lazy-loaded as its own chunk and is legitimately large.
    chunkSizeWarningLimit: 800,
  },
})
