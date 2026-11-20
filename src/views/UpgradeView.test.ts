// @vitest-environment happy-dom
// PRD F5: from the free plan, a gated screen lands on /upgrade, and after upgrading lands back there.
import { PLAN_PRICE_USD } from '@/config/plan'
import { gateRedirect } from '@/router/gate'
import { useDemoStore } from '@/state/demo'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import UpgradeView from './UpgradeView.vue'

const Blank = { template: '<div />' }

async function open(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/upgrade', component: UpgradeView, meta: { title: 'Upgrade' } },
      { path: '/connect', component: Blank, meta: { title: 'Connect', paid: true } },
      { path: '/trades', component: Blank, meta: { title: 'Trades', paid: true } },
      { path: '/portfolio', component: Blank, meta: { title: 'Portfolio' } },
    ],
  })
  router.beforeEach((to) => gateRedirect(to, useDemoStore().plan) ?? true)
  await router.push(path)
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })
  await flushPromises()
  return { router, wrapper }
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('UpgradeView', () => {
  it('sends a free user who asks for Connect brokerage to the wall, then back to /connect after the simulated upgrade', async () => {
    const { router, wrapper } = await open('/connect')
    expect(router.currentRoute.value.fullPath).toBe('/upgrade?next=/connect')
    expect(wrapper.text()).toContain('Connect brokerage is on the paid plan')

    await wrapper.get('button.btn-primary').trigger('click')
    await flushPromises()
    expect(useDemoStore().plan).toBe('paid')
    expect(router.currentRoute.value.fullPath).toBe('/connect')
  })

  it('compares Free and Paid at the flat price from PLAN_PRICE_USD, with no payment form', async () => {
    const { wrapper } = await open('/upgrade')
    expect(wrapper.findAll('.plan')).toHaveLength(2)
    expect(wrapper.get('.plan--paid').text()).toContain('$' + PLAN_PRICE_USD)
    expect(wrapper.get('.plan--paid').text()).toContain('a month, flat')
    for (const feature of ['Connect your brokerage', 'Live monitoring', 'Approval-gated trades']) expect(wrapper.get('.plan--paid').text()).toContain(feature)
    expect(wrapper.get('button.btn-primary').text()).toBe('Start paid plan (demo)')
    expect(wrapper.findAll('input, form')).toHaveLength(0)
  })

  it('goes to /connect when no destination was asked for, and ignores a destination outside the app', async () => {
    const plain = await open('/upgrade')
    await plain.wrapper.get('button.btn-primary').trigger('click')
    await flushPromises()
    expect(plain.router.currentRoute.value.fullPath).toBe('/connect')

    setActivePinia(createPinia())
    localStorage.clear()
    const hostile = await open('/upgrade?next=https://example.com')
    await hostile.wrapper.get('button.btn-primary').trigger('click')
    await flushPromises()
    expect(hostile.router.currentRoute.value.fullPath).toBe('/connect')
  })

  it('offers to continue, not to pay again, once on the paid plan', async () => {
    useDemoStore().upgrade()
    const { wrapper } = await open('/upgrade?next=/trades')
    expect(wrapper.find('button.btn-primary').exists()).toBe(false)
    const link = wrapper.get('a.btn-primary')
    expect(link.text()).toBe('Continue to Trade approval')
    expect(link.attributes('href')).toBe('/trades')
  })
})
