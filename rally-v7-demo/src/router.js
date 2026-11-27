import { createRouter, createWebHashHistory } from 'vue-router'

const v = (name) => () => import(`./views/${name}.vue`)

// Hash history so the build runs from any static host (GitHub Pages, a zip, a folder).
export const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: v('LandingView') },

    // Check flow
    { path: '/check', component: v('FirstVisitView') },
    { path: '/check/lines', component: v('PickLinesView') },
    { path: '/check/amount', component: v('AmountView') },
    { path: '/check/printing', component: v('PrintingView') },
    { path: '/check/receipt', component: v('ReceiptView') },
    { path: '/check/unsupported', component: v('UnsupportedView') },

    // Connect an account
    { path: '/connect/:step(1|2|3)', component: v('ConnectView'), props: true },

    // Sign in
    { path: '/signin', component: v('SignInView') },
    { path: '/signin/code', component: v('CodeView') },

    // App
    { path: '/home', component: v('HomeView') },
    { path: '/home/clear', component: v('HomeClearView') },
    { path: '/home/unavailable', component: v('HomeUnavailableView') },
    { path: '/breakdown', component: v('BreakdownView') },
    { path: '/whatif', component: v('WhatIfView') },
    { path: '/basket', component: v('BasketView') },
    { path: '/basket/order/:step(1|2|3|4)', component: v('BasketOrderView'), props: true },
    { path: '/redirect', component: v('RedirectView') },
    { path: '/receipts', component: v('ReceiptsView') },
    { path: '/lines', component: v('LinesView') },
    { path: '/explore', component: v('ExploreView') },
    { path: '/alerts', component: v('AlertsView') },
    { path: '/plans', component: v('PlansView') },
    { path: '/account', component: v('AccountView') },

    { path: '/:rest(.*)*', redirect: '/' },
  ],
})
