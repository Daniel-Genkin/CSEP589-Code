// Fonts are bundled with the app (no font CDN): Anton shouts, Work Sans talks, Plex Mono labels.
import '@fontsource/anton/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/work-sans/latin-400.css'
import '@fontsource/work-sans/latin-500.css'
import '@fontsource/work-sans/latin-600.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Scroll-in motion (Rally V7). Elements stay hidden until they scroll into view, then move into place.
//   v-reveal="{ x, y, scale, blur, delay }"           one element
//   v-stagger="{ x, y, scale, blur, delay, step }"    each child, one after another
function prime(el, o = {}) {
  el.classList.add('reveal')
  el.style.setProperty('--rx', (o.x ?? 0) + 'px')
  el.style.setProperty('--ry', (o.y ?? 56) + 'px')
  el.style.setProperty('--rs', o.scale ?? 1)
  el.style.setProperty('--rb', (o.blur ?? 0) + 'px')
  el.style.setProperty('--rd', (o.delay ?? 0) + 's')
}
const io =
  typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('in')
              io.unobserve(e.target)
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
      )
const watchIn = (el) => (io ? io.observe(el) : el.classList.add('in'))
app.directive('reveal', {
  mounted(el, b) {
    prime(el, b.value)
    watchIn(el)
  },
})
app.directive('stagger', {
  mounted(el, b) {
    const o = b.value || {}
    ;[...el.children].forEach((c, i) => {
      prime(c, { ...o, delay: (o.delay || 0) + i * (o.step ?? 0.09) })
      watchIn(c)
    })
  },
})

app.mount('#app')
