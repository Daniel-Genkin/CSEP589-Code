import '@fontsource-variable/fraunces/soft-italic.css'
import '@fontsource-variable/fraunces/soft.css'
import '@fontsource-variable/plus-jakarta-sans'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
