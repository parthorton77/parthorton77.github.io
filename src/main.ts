import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.scss'

// We restore our own positions from the URL hash; the browser's guess would fight the journey.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createApp(App).mount('#app')
