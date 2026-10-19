import AppLayout from '@/components/layout/AppLayout.vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import { useSessionStore } from '@/stores/session'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/views/LandingView.vue'), meta: { title: 'Invest in what you believe in' } },
      { path: 'pricing', name: 'pricing', component: () => import('@/views/PricingView.vue'), meta: { title: 'Pricing' } },
    ],
  },
  { path: '/signup', name: 'signup', component: () => import('@/views/auth/SignupView.vue'), meta: { title: 'Create your account', guestOnly: true } },
  { path: '/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { title: 'Log in', guestOnly: true } },
  { path: '/s/:shareId', name: 'shared', component: () => import('@/views/SharedAnalysisView.vue'), meta: { title: 'Shared analysis' } },
  {
    path: '/preview/email/:alertId',
    name: 'email-preview',
    component: () => import('@/views/app/EmailPreviewView.vue'),
    meta: { title: 'Email preview', requiresAuth: true },
  },
  {
    path: '/app',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/app/DashboardView.vue'), meta: { title: 'Home' } },
      { path: 'scan/new', name: 'scan-new', component: () => import('@/views/app/NewScanView.vue'), meta: { title: 'New scan' } },
      {
        path: 'scan/:scanId/progress',
        name: 'scan-progress',
        component: () => import('@/views/app/ScanProgressView.vue'),
        meta: { title: 'Scanning…' },
      },
      { path: 'scan/:scanId', name: 'scan-results', component: () => import('@/views/app/ScanResultsView.vue'), meta: { title: 'Scan results' } },
      {
        path: 'scan/:scanId/:symbol',
        name: 'holding',
        component: () => import('@/views/app/HoldingDetailView.vue'),
        meta: { title: 'Analysis' },
      },
      { path: 'monitoring', name: 'monitoring', component: () => import('@/views/app/MonitoringView.vue'), meta: { title: 'Monitoring' } },
      { path: 'alerts', name: 'alerts', component: () => import('@/views/app/AlertsView.vue'), meta: { title: 'Alerts' } },
      { path: 'alerts/:alertId', name: 'alert', component: () => import('@/views/app/AlertDetailView.vue'), meta: { title: 'Alert' } },
      { path: 'plan', name: 'plan', component: () => import('@/views/app/PlanView.vue'), meta: { title: 'Plan & billing' } },
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
      return new Promise((resolve) => setTimeout(() => resolve({ el: to.hash, top: 88, behavior: 'smooth' }), delay))
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
  if (to.meta.guestOnly && session.isAuthed) return { name: 'dashboard' }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · outvest` : 'outvest'
})

export default router
