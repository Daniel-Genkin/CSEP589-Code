<script setup>
import { investService, isMockApi } from '@/api'
import { useSessionStore } from '@/stores/session'
import { Lock, ShieldCheck } from '@lucide/vue'
import { onMounted, reactive, ref } from 'vue'

const emit = defineEmits(['opened'])
const session = useSessionStore()

const STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ')
const EMPLOYMENT = [
  { value: 'employed', label: 'Employed' },
  { value: 'self-employed', label: 'Self-employed' },
  { value: 'student', label: 'Student' },
  { value: 'unemployed', label: 'Not working right now' },
  { value: 'retired', label: 'Retired' },
]
const EXPERIENCE = [
  { value: 'none', label: 'New to investing' },
  { value: 'some', label: 'Some experience' },
  { value: 'experienced', label: 'Experienced' },
]

const form = reactive({
  legalName: session.user?.name ?? '',
  dateOfBirth: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  employment: '',
  experience: '',
  bankId: '',
  agreed: false,
})
const errors = reactive({})
const banks = ref([])
const submitting = ref(false)
const formError = ref('')

onMounted(async () => {
  banks.value = await investService.banks()
})

async function submit() {
  Object.keys(errors).forEach((key) => delete errors[key])
  formError.value = ''
  submitting.value = true
  try {
    const account = await investService.openAccount({ ...form, zip: form.zip.trim() })
    await session.refresh()
    emit('opened', account)
  } catch (err) {
    if (err.details) Object.assign(errors, err.details)
    formError.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="account" novalidate @submit.prevent="submit">
    <p class="callout account__intro">
      <ShieldCheck :size="18" />
      <span>
        Your account is opened with Outvest’s registered brokerage partner, which holds your investments. It takes about
        five minutes.
      </span>
    </p>

    <fieldset class="account__group">
      <legend>About you</legend>
      <div class="account__grid">
        <div class="field">
          <label class="label" for="acct-name">Full legal name</label>
          <input id="acct-name" v-model="form.legalName" class="input" :class="{ 'is-invalid': errors.legalName }" autocomplete="name" />
          <span v-if="errors.legalName" class="field-error">{{ errors.legalName }}</span>
        </div>
        <div class="field">
          <label class="label" for="acct-dob">Date of birth</label>
          <input id="acct-dob" v-model="form.dateOfBirth" type="date" class="input" :class="{ 'is-invalid': errors.dateOfBirth }" autocomplete="bday" />
          <span v-if="errors.dateOfBirth" class="field-error">{{ errors.dateOfBirth }}</span>
        </div>
      </div>
    </fieldset>

    <fieldset class="account__group">
      <legend>Home address</legend>
      <div class="field">
        <label class="label" for="acct-street">Street address</label>
        <input id="acct-street" v-model="form.street" class="input" :class="{ 'is-invalid': errors.street }" autocomplete="street-address" />
        <span v-if="errors.street" class="field-error">{{ errors.street }}</span>
      </div>
      <div class="account__grid account__grid--address">
        <div class="field">
          <label class="label" for="acct-city">City</label>
          <input id="acct-city" v-model="form.city" class="input" :class="{ 'is-invalid': errors.city }" autocomplete="address-level2" />
          <span v-if="errors.city" class="field-error">{{ errors.city }}</span>
        </div>
        <div class="field">
          <label class="label" for="acct-state">State</label>
          <select id="acct-state" v-model="form.state" class="input" :class="{ 'is-invalid': errors.state }" autocomplete="address-level1">
            <option value="" disabled>Pick one</option>
            <option v-for="s in STATES" :key="s" :value="s">{{ s }}</option>
          </select>
          <span v-if="errors.state" class="field-error">{{ errors.state }}</span>
        </div>
        <div class="field">
          <label class="label" for="acct-zip">ZIP code</label>
          <input id="acct-zip" v-model="form.zip" class="input" :class="{ 'is-invalid': errors.zip }" inputmode="numeric" maxlength="5" autocomplete="postal-code" />
          <span v-if="errors.zip" class="field-error">{{ errors.zip }}</span>
        </div>
      </div>
    </fieldset>

    <fieldset class="account__group">
      <legend>Two quick questions</legend>
      <div class="account__grid">
        <div class="field">
          <label class="label" for="acct-employment">Employment</label>
          <select id="acct-employment" v-model="form.employment" class="input" :class="{ 'is-invalid': errors.employment }">
            <option value="" disabled>Pick one</option>
            <option v-for="o in EMPLOYMENT" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <span v-if="errors.employment" class="field-error">{{ errors.employment }}</span>
        </div>
        <div class="field">
          <label class="label" for="acct-experience">Investing experience</label>
          <select id="acct-experience" v-model="form.experience" class="input" :class="{ 'is-invalid': errors.experience }">
            <option value="" disabled>Pick one</option>
            <option v-for="o in EXPERIENCE" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <span v-if="errors.experience" class="field-error">{{ errors.experience }}</span>
        </div>
      </div>
    </fieldset>

    <fieldset class="account__group">
      <legend>Where your money comes from</legend>
      <div v-if="banks.length" class="banks" role="radiogroup" aria-label="Funding bank">
        <label v-for="bank in banks" :key="bank.id" class="bank" :class="{ 'is-on': form.bankId === bank.id }">
          <input v-model="form.bankId" type="radio" name="bank" :value="bank.id" />
          <span class="bank__mark">{{ bank.name[0] }}</span>
          <span class="bank__name">{{ bank.name }}</span>
        </label>
      </div>
      <div v-else class="banks">
        <div v-for="n in 4" :key="n" class="skeleton" style="height: 56px" />
      </div>
      <span v-if="errors.bankId" class="field-error">{{ errors.bankId }}</span>
    </fieldset>

    <label class="agree">
      <input v-model="form.agreed" type="checkbox" />
      <span>
        I agree to the brokerage partner’s customer agreement and understand that investing involves risk, including
        losing money I invest.
      </span>
    </label>
    <span v-if="errors.agreed" class="field-error">{{ errors.agreed }}</span>

    <p v-if="isMockApi" class="account__demo"><Lock :size="14" /> Demo only: no real identity check or bank link happens here.</p>
    <p v-if="formError && !Object.keys(errors).length" class="field-error">{{ formError }}</p>

    <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="submitting">
      <span v-if="submitting" class="spinner" />
      {{ submitting ? 'Opening your account…' : 'Open my account' }}
    </button>
  </form>
</template>

<style scoped>
.account {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.account__group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  border: 0;
}
.account__group legend {
  margin-bottom: 10px;
  padding: 0;
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--deep-violet);
}
.account__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.account__grid--address {
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.7fr) minmax(0, 0.8fr);
}
select.input {
  appearance: auto;
}
.banks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.bank {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: var(--outline-thin);
  border-radius: 14px;
  background: var(--surface);
  cursor: pointer;
  transition:
    background-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;
}
.bank input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.bank:hover {
  background: var(--sun-50);
}
.bank.is-on {
  background: var(--sun-100);
  box-shadow: var(--shadow-sm);
  transform: translate(-2px, -2px);
}
.bank:focus-within {
  outline: 3px solid var(--signal);
  outline-offset: 2px;
}
.bank__mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 1.5px solid var(--ink-solid);
  border-radius: 10px;
  background: var(--signal);
  color: var(--cream);
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 17px;
}
.bank__name {
  font-size: 14px;
  font-weight: 650;
}
.agree {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: var(--ink-2);
  cursor: pointer;
}
.agree input {
  margin-top: 2px;
  flex-shrink: 0;
}
.account__demo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--muted);
}
@media (max-width: 640px) {
  .account__grid,
  .account__grid--address,
  .banks {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
