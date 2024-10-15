
// Global styles 
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Components
import App from './App.vue'
import SelectFileView from './views/SelectFileView.vue'
import ExplainFileView from './views/ExplainFileView.vue'

// Composables
import { createApp } from 'vue'
import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router'
import { createVuetify } from 'vuetify'

// Creates app
const app = createApp(App)

// Setup router
const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: "navigation", component: SelectFileView },
        { path: '/:id', name: "explain", component: ExplainFileView, props: true },
    ],
})
app.use(router)

// Setup vuetify 
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
  },
})
app.use(vuetify)

app.mount('#app')

