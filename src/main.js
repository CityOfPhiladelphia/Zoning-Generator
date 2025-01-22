import '@fortawesome/fontawesome-free/css/all.css'
import 'leaflet/dist/leaflet.css'
import './assets/css/phila-app.min.css'
import './assets/css/stylesheet.css'

// import './js/map.js';
import './tables/baseDistricts.js';
import './tables/overlaysNew.js';

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

