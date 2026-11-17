// The PRD's eight screens. Client-side routing with the History API: no full page reloads,
// working back and forward, state kept in the store across navigation.
import { useDemoStore } from '@/state/demo'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { gateRedirect } from './gate'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    /** Needs the paid plan; free users are sent to /upgrade?next=… */
    paid?: boolean
  }
}

/** A little longer than the `.page-leave-active` transition in main.css (0.22s). */
const PAGE_TRANSITION_MS = 260

const stub = () => import('@/views/ScreenStub.vue')

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: 'Know what you own' } },
  { path: '/portfolio', name: 'portfolio', component: () => import('@/views/PortfolioView.vue'), meta: { title: 'Portfolio' } },
  { path: '/whatif', name: 'whatif', component: () => import('@/views/WhatIfView.vue'), meta: { title: 'What-if' } },
  {
    path: '/settings',
    name: 'settings',
    component: stub,
    meta: { title: 'Values' },
    props: {
      eyebrow: 'Your Rally · Values',
      title: 'Your lines. Your call.',
      lead: 'Choose the categories you care about. Every other screen follows.',
      requirement: 'F9',
    },
  },
  {
    path: '/upgrade',
    name: 'upgrade',
    component: () => import('@/views/UpgradeView.vue'),
    meta: { title: 'Upgrade' },
  },
  {
    path: '/connect',
    name: 'connect',
    component: stub,
    meta: { title: 'Connect brokerage', paid: true },
    props: {
      eyebrow: 'Your Rally · Connect brokerage',
      title: 'Bring your account.',
      lead: 'Rally reads what you own. The money stays at your broker.',
      requirement: 'F6',
    },
  },
  {
    path: '/trades',
    name: 'trades',
    component: stub,
    meta: { title: 'Trade approval', paid: true },
    props: {
      eyebrow: 'Your Rally · Trade approval',
      title: 'Nothing moves until you say so.',
      lead: 'The trades that would carry out your what-if choices, for you to review and approve.',
      requirement: 'F7',
    },
  },
  {
    path: '/alerts',
    name: 'alerts',
    component: stub,
    meta: { title: 'Alerts' },
    props: {
      eyebrow: 'Your Rally · Alerts',
      title: 'The latest receipts.',
      lead: 'Changes to the companies you hold, in the categories you care about.',
      requirement: 'F8',
    },
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { title: 'Not found' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    const samePage = to.path === from.path
    if (samePage && !to.hash && !savedPosition) return false
    const position = savedPosition ?? (to.hash ? { el: to.hash, top: 24, behavior: 'smooth' as const } : { top: 0 })
    if (samePage) return position
    // The old screen fades out before the new one mounts. Scrolling now would move (or clamp to)
    // the screen that is leaving, so wait until the new one is in place.
    return new Promise((resolve) => setTimeout(() => resolve(position), PAGE_TRANSITION_MS))
  },
})

router.beforeEach((to) => gateRedirect(to, useDemoStore().plan) ?? true)

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Rally` : 'Rally'
})

export default router
