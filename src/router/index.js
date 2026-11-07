import PublicLayout from '@/components/layout/PublicLayout.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/LandingView.vue'),
        meta: { title: 'Turn your climate hot take into a real portfolio', ground: 'blue' },
      },
      {
        path: 't/:thesisId',
        name: 'public-thesis',
        component: () => import('@/views/ThesisPublicView.vue'),
        meta: { title: 'Climate thesis', ground: 'blue' },
      },
      {
        path: 'u/:handle',
        name: 'profile',
        component: () => import('@/views/ProfileView.vue'),
        meta: { title: 'Track record', ground: 'blue' },
      },
    ],
  },
  // The product isn't live yet: signup, login, pricing and the in-app pages
  // are replaced by the landing page, whose calls-to-action open the
  // willingness-to-pay survey. Named stubs keep untouched views that still
  // push { name: 'signup' } / { name: 'login' } from throwing.
  { path: '/signup', name: 'signup', redirect: { path: '/' } },
  { path: '/login', name: 'login', redirect: { path: '/' } },
  { path: '/pricing', name: 'pricing', redirect: { path: '/' } },
  { path: '/app/:rest(.*)*', name: 'dashboard', redirect: { path: '/' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { title: 'Not found' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      // Wait for the page transition to render the target section.
      const delay = to.path === from.path ? 0 : 320
      return new Promise((resolve) => setTimeout(() => resolve({ el: to.hash, top: 24, behavior: 'smooth' }), delay))
    }
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Outvest` : 'Outvest'
})

export default router
