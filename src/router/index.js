import AppLayout from '@/components/layout/AppLayout.vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import { useSessionStore } from '@/stores/session'
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
      { path: 'pricing', name: 'pricing', component: () => import('@/views/PricingView.vue'), meta: { title: 'Pricing' } },
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
  { path: '/signup', name: 'signup', component: () => import('@/views/auth/SignupView.vue'), meta: { title: 'Create your account', guestOnly: true } },
  { path: '/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { title: 'Log in', guestOnly: true } },
  {
    path: '/app',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/app/DashboardView.vue'), meta: { title: 'Home' } },
      { path: 'pitch', name: 'pitch', component: () => import('@/views/app/PitchView.vue'), meta: { title: 'New thesis' } },
      { path: 'theses', name: 'theses', component: () => import('@/views/app/ThesesView.vue'), meta: { title: 'My theses' } },
      { path: 'theses/:thesisId', name: 'thesis', component: () => import('@/views/app/ThesisView.vue'), meta: { title: 'Workshop' } },
      {
        path: 'theses/:thesisId/invest',
        name: 'invest',
        component: () => import('@/views/app/InvestView.vue'),
        meta: { title: 'Invest' },
      },
      { path: 'community', name: 'community', component: () => import('@/views/app/CommunityView.vue'), meta: { title: 'Community' } },
      { path: 'portfolio', name: 'portfolio', component: () => import('@/views/app/PortfolioView.vue'), meta: { title: 'Portfolio' } },
      { path: 'alerts', name: 'alerts', component: () => import('@/views/app/AlertsView.vue'), meta: { title: 'Alerts' } },
      { path: 'alerts/:alertId', name: 'alert', component: () => import('@/views/app/AlertDetailView.vue'), meta: { title: 'Alert' } },
      { path: 'settings', name: 'settings', component: () => import('@/views/app/SettingsView.vue'), meta: { title: 'Settings' } },
    ],
  },
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

router.beforeEach(async (to) => {
  const session = useSessionStore()
  await session.init()
  if (to.matched.some((r) => r.meta.requiresAuth) && !session.isAuthed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && session.isAuthed) {
    // Someone already signed in who arrives with a pitch goes straight to building it.
    return typeof to.query.idea === 'string' ? { name: 'pitch', query: { idea: to.query.idea } } : { name: 'dashboard' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Outvest` : 'Outvest'
})

export default router
