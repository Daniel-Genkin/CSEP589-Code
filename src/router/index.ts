// Rally V7 screens. Client-side routing with the History API: no full page reloads,
// working back and forward, state kept in the store across navigation.
import { useDemoStore } from '@/state/demo'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { gateRedirect } from './gate'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    /** Needs the paid plan; free users are sent to /upgrade?next=… */
    paid?: boolean
    /** Needs a checked fund or portfolio; without one the check flow starts */
    needsPortfolio?: boolean
  }
}

const view = (name: string) => () => import(`@/views/${name}.vue`)

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'landing', component: view('LandingView'), meta: { title: 'Know what you own' } },

  // Check a fund
  { path: '/check', name: 'check', component: view('FirstVisitView'), meta: { title: 'Pick your fund' } },
  { path: '/check/lines', name: 'check-lines', component: view('PickLinesView'), meta: { title: 'Your lines' } },
  { path: '/check/amount', name: 'check-amount', component: view('AmountView'), meta: { title: 'Amount' } },
  { path: '/check/printing', name: 'check-printing', component: view('PrintingView'), meta: { title: 'Printing your receipt' } },
  { path: '/check/receipt', name: 'receipt', component: view('ReceiptView'), meta: { title: 'Your receipt', needsPortfolio: true } },
  { path: '/check/unsupported', name: 'unsupported', component: view('UnsupportedView'), meta: { title: 'Can’t check this fund' } },

  // Account
  { path: '/signin', name: 'signin', component: view('SignInView'), meta: { title: 'Sign in' } },
  { path: '/signin/code', name: 'signin-code', component: view('CodeView'), meta: { title: 'Check your email' } },
  { path: '/upgrade', name: 'upgrade', component: view('PlansView'), meta: { title: 'Plans' } },
  { path: '/account', name: 'account', component: view('AccountView'), meta: { title: 'Account' } },
  { path: '/connect/:step(1|2|3)?', name: 'connect', component: view('ConnectView'), props: true, meta: { title: 'Connect an account', paid: true } },

  // App tabs
  { path: '/home', name: 'home', component: view('HomeView'), meta: { title: 'Home', needsPortfolio: true } },
  { path: '/breakdown', name: 'breakdown', component: view('BreakdownView'), meta: { title: 'Breakdown', needsPortfolio: true } },
  { path: '/whatif', name: 'whatif', component: view('WhatIfView'), meta: { title: 'What-if', needsPortfolio: true } },
  { path: '/basket', name: 'basket', component: view('BasketView'), meta: { title: 'Basket', needsPortfolio: true } },
  { path: '/basket/review', name: 'basket-review', component: view('BasketReviewView'), meta: { title: 'Review your basket', needsPortfolio: true } },
  { path: '/trades', name: 'trades', component: view('TradesView'), meta: { title: 'Approve trades', paid: true, needsPortfolio: true } },
  { path: '/basket/done', name: 'basket-done', component: view('BasketDoneView'), meta: { title: 'Basket done', needsPortfolio: true } },
  { path: '/redirect', name: 'redirect', component: view('RedirectView'), meta: { title: 'Redirect deposits', needsPortfolio: true } },
  { path: '/receipts', name: 'receipts', component: view('ReceiptsView'), meta: { title: 'Receipts', needsPortfolio: true } },
  { path: '/lines', name: 'lines', component: view('LinesView'), meta: { title: 'Your lines' } },
  { path: '/explore', name: 'explore', component: view('ExploreView'), meta: { title: 'Explore' } },
  { path: '/alerts', name: 'alerts', component: view('AlertsView'), meta: { title: 'Alerts' } },

  // Older paths
  { path: '/portfolio', redirect: '/home' },
  { path: '/settings', redirect: '/lines' },
  { path: '/plans', redirect: '/upgrade' },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: view('NotFoundView'), meta: { title: 'Not found' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.path === from.path) return false
    return savedPosition ?? { top: 0 }
  },
})

router.beforeEach((to) => {
  const demo = useDemoStore()
  const gated = gateRedirect(to, demo.plan)
  if (gated) return gated
  if (to.meta.needsPortfolio && !demo.portfolio) return { path: '/check' }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Rally` : 'Rally'
})

export default router
