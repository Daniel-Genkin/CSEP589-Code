<script setup>
import { computed, ref } from 'vue'
import { Check } from '@lucide/vue'
import FlowShell from '../components/FlowShell.vue'
import Row from '../components/Row.vue'
import Field from '../components/Field.vue'

const props = defineProps({ step: String })
const n = computed(() => Number(props.step))
const amount = ref('$500')
const name = ref('Alex Lee')
const dob = ref('')
const addr = ref('')
const ssn = ref('')
const agree = ref(true)
</script>

<template>
  <FlowShell v-if="n === 1" :steps="4" :step="1" label="Basket · Step 1 of 4" back="/basket" logo-to="/home" title="Review your basket." body="Your basket follows the S&P 500 without ExxonMobil. Its 3.0% is spread across the other 502 companies.">
    <div class="section-head"><h3>What changes</h3></div>
    <div class="list">
      <Row tk="XOM" title="Left out" sub="ExxonMobil · Environment & climate" right="1 company" />
      <Row title="Companies in your basket" right="502" />
      <Row title="Crosses your lines" right="13% → 10.3%" />
      <Row title="Behind the S&P 500 in 2025" right="0.4 pts" />
    </div>
    <div class="section-head"><h3>How much to invest</h3></div>
    <div class="card-pad">
      <Field v-model="amount" label="Amount" />
      <div class="presets"><button v-for="p in ['$500', '$1,000', '$5,000', '$10,000']" :key="p" class="chip chip-outline" @click="amount = p">{{ p }}</button></div>
    </div>
    <RouterLink to="/basket/order/2" class="btn btn-primary btn-block">Continue</RouterLink>
    <p class="caption">Sample data. Past results don’t predict future returns.</p>
  </FlowShell>

  <FlowShell v-else-if="n === 2" :steps="4" :step="2" label="Basket · Step 2 of 4" back="/basket/order/1" logo-to="/home" title="Open your account." body="Your basket is held at Alpaca Securities, a registered broker. It takes about 3 minutes, and Rally never holds your money.">
    <div class="section-head"><h3>About you</h3></div>
    <div class="card-pad">
      <Field v-model="name" label="Legal name" />
      <Field v-model="dob" label="Date of birth" placeholder="MM / DD / YYYY" />
      <Field v-model="addr" label="Home address" placeholder="Street, city, state, ZIP" />
      <Field v-model="ssn" label="Social Security number" placeholder="•••-••-••••" hint="Required by law to open an investing account. Demo only; don’t enter a real number." />
    </div>
    <label class="agree"><button class="box" :class="{ on: agree }" role="checkbox" :aria-checked="agree" @click="agree = !agree"><Check v-if="agree" :size="15" /></button>I agree to Alpaca’s customer agreement and Rally’s terms.</label>
    <RouterLink to="/basket/order/3" class="btn btn-primary btn-block" :class="{ off: !agree }">Open Account</RouterLink>
    <p class="caption">Brokerage services by Alpaca Securities LLC, member FINRA/SIPC.</p>
  </FlowShell>

  <FlowShell v-else-if="n === 3" :steps="4" :step="3" label="Basket · Step 3 of 4" back="/basket/order/2" logo-to="/home" title="Add money and confirm." body="Money moves from your bank to Alpaca. Your basket is bought when it arrives, usually in 1 to 3 business days.">
    <div class="section-head"><h3>From</h3></div>
    <div class="list"><Row tk="BANK" title="Checking ••4821" sub="Linked bank" right="Change" right-tone="link" /></div>
    <div class="section-head"><h3>Your order</h3></div>
    <div class="list">
      <Row title="Amount" :right="amount.includes('.') ? amount : amount + '.00'" />
      <Row title="Basket" sub="S&P 500 without ExxonMobil" right="502 companies" />
      <Row title="Money arrives" right="Dec 1 to 3" />
    </div>
    <RouterLink to="/basket/order/4" class="btn btn-primary btn-block">Place Order</RouterLink>
    <p class="caption">You can cancel until your money arrives.</p>
  </FlowShell>

  <FlowShell v-else :steps="4" :step="4" label="Basket · Done" :back="false" logo-to="/home" title="Your basket is on its way." :body="`We’ll let you know when your ${amount} arrives and your basket is bought.`">
    <div class="section-head"><h3>What happens next</h3></div>
    <div class="list">
      <Row title="Order placed" sub="Today" icon="check" />
      <Row title="Money arrives" sub="Dec 1 to 3" icon="pending" />
      <Row title="Basket bought" sub="Right after your money arrives" icon="pending" />
    </div>
    <RouterLink to="/basket" class="btn btn-primary btn-block">Go to Basket</RouterLink>
    <RouterLink to="/home" class="btn-link" style="align-self: flex-start">Back to Home</RouterLink>
  </FlowShell>
</template>

<style scoped>
.presets { display: flex; gap: 8px; }
.presets .chip { height: 36px; font-size: 14px; }
.agree { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--dim); }
.box { width: 22px; height: 22px; border-radius: 6px; border: 1.5px solid var(--mute); display: grid; place-items: center; color: var(--ink); flex: none; }
.box.on { background: var(--sun); border-color: var(--sun); }
.off { opacity: 0.4; pointer-events: none; }
</style>
