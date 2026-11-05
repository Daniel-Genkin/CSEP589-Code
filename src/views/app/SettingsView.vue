<script setup>
import { authService, investService, isMockApi } from '@/api'
import BrokerageAccountForm from '@/components/invest/BrokerageAccountForm.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiToggle from '@/components/ui/UiToggle.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useAlertsStore } from '@/stores/alerts'
import { useSessionStore } from '@/stores/session'
import { formatDateLong } from '@/utils/format'
import { ExternalLink, Landmark, LogOut, RotateCcw } from '@lucide/vue'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const session = useSessionStore()
const alerts = useAlertsStore()
const toast = useToast()

const profile = reactive({
  name: session.user.name,
  email: session.user.email,
  handle: session.user.handle,
  bio: session.user.bio,
})
const profileErrors = reactive({})
const savingProfile = ref(false)
const prefs = reactive({ ...session.user.preferences })
const accountOpen = ref(false)
const { data: account, run: reloadAccount } = useAsync(() => investService.getAccount())

const ALERT_PREFS = [
  { key: 'weakens', label: 'News that weakens a claim', description: 'The alerts that matter most: something cuts against your thesis.' },
  { key: 'strengthens', label: 'News that strengthens a claim', description: 'Evidence that one of your claims is playing out.' },
  { key: 'rebalance', label: 'Rebalance heads-ups', description: 'A few days before a basket you own is rebalanced.' },
]

async function saveProfile() {
  Object.keys(profileErrors).forEach((key) => delete profileErrors[key])
  savingProfile.value = true
  try {
    await session.update({ ...profile })
    profile.handle = session.user.handle
    toast.success('Profile updated')
  } catch (err) {
    if (err.details) Object.assign(profileErrors, err.details)
    else toast.error('Couldn’t save your profile', { description: err.message })
  } finally {
    savingProfile.value = false
  }
}

async function savePref(key, value) {
  prefs[key] = value
  try {
    await session.update({ preferences: { [key]: value } })
    toast.success('Preferences saved')
  } catch (err) {
    prefs[key] = !value
    toast.error('Couldn’t save that change', { description: err.message })
  }
}

async function onAccountOpened() {
  accountOpen.value = false
  await reloadAccount()
  toast.success('Your brokerage account is open')
}

async function logout() {
  await session.logout()
  alerts.reset()
  router.push('/')
}

async function resetDemo() {
  const { resetMockDb } = await import('@/api/mock/db')
  resetMockDb()
  authService.clearSession()
  window.location.assign(import.meta.env.BASE_URL)
}
</script>

<template>
  <div class="page settings">
    <header class="page-head">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-sub">Your profile, your alerts and your brokerage account.</p>
      </div>
    </header>

    <section class="card card-pad block">
      <div class="block__head block__head--row">
        <div>
          <p class="card-title">Profile</p>
          <p class="card-sub">Your name, handle and bio appear on theses you publish and on your public track record.</p>
        </div>
        <RouterLink :to="`/u/${session.user.handle}`" class="btn btn-ghost btn-sm"><ExternalLink :size="15" /> Public profile</RouterLink>
      </div>
      <form class="profile" novalidate @submit.prevent="saveProfile">
        <div class="field">
          <label class="label" for="settings-name">Name</label>
          <input id="settings-name" v-model="profile.name" class="input" :class="{ 'is-invalid': profileErrors.name }" autocomplete="name" />
          <span v-if="profileErrors.name" class="field-error">{{ profileErrors.name }}</span>
        </div>
        <div class="field">
          <label class="label" for="settings-email">Email</label>
          <input id="settings-email" v-model="profile.email" type="email" class="input" :class="{ 'is-invalid': profileErrors.email }" autocomplete="email" />
          <span v-if="profileErrors.email" class="field-error">{{ profileErrors.email }}</span>
        </div>
        <div class="field">
          <label class="label" for="settings-handle">Handle</label>
          <div class="handle">
            <span class="handle__at">@</span>
            <input id="settings-handle" v-model="profile.handle" class="input" :class="{ 'is-invalid': profileErrors.handle }" autocomplete="username" />
          </div>
          <span v-if="profileErrors.handle" class="field-error">{{ profileErrors.handle }}</span>
        </div>
        <div class="field profile__bio">
          <label class="label" for="settings-bio">Bio</label>
          <textarea
            id="settings-bio"
            v-model="profile.bio"
            class="input"
            :class="{ 'is-invalid': profileErrors.bio }"
            maxlength="160"
            placeholder="What do you know that the market doesn’t? e.g. “Building energy engineer in Seattle.”"
          />
          <span v-if="profileErrors.bio" class="field-error">{{ profileErrors.bio }}</span>
          <span v-else class="field-hint">{{ profile.bio.length }}/160</span>
        </div>
        <div class="profile__actions">
          <button type="submit" class="btn btn-primary" :disabled="savingProfile">
            <span v-if="savingProfile" class="spinner" />
            Save profile
          </button>
        </div>
      </form>
    </section>

    <section class="card card-pad block">
      <div class="block__head">
        <p class="card-title">Alerts</p>
        <p class="card-sub">Outvest only alerts you when news affects one of your theses. Choose which ones you want.</p>
      </div>
      <div class="toggles">
        <UiToggle
          v-for="pref in ALERT_PREFS"
          :key="pref.key"
          :model-value="prefs[pref.key]"
          :label="pref.label"
          :description="pref.description"
          @update:model-value="savePref(pref.key, $event)"
        />
        <UiToggle
          :model-value="prefs.productEmails"
          label="Product news by email"
          description="New themes and features. About once a month."
          @update:model-value="savePref('productEmails', $event)"
        />
      </div>
    </section>

    <section class="card card-pad block">
      <div class="block__head">
        <p class="card-title">Brokerage account</p>
        <p class="card-sub">Held with Outvest’s registered brokerage partner.</p>
      </div>
      <div v-if="account" class="account">
        <span class="account__icon"><Landmark :size="18" /></span>
        <span class="grow">
          <strong>Account ••{{ account.last4 }}</strong>
          <span class="muted text-sm">
            {{ account.legalName }} · opened {{ formatDateLong(account.openedAt) }} · funded from {{ account.bank.name }} ••{{ account.bank.last4 }}
          </span>
        </span>
        <span class="badge badge-brand">Open</span>
      </div>
      <div v-else class="account account--empty">
        <span class="grow muted">No brokerage account yet. You only need one to invest; building and publishing theses is free.</span>
        <button type="button" class="btn btn-secondary btn-sm" @click="accountOpen = true">Open an account</button>
      </div>
    </section>

    <section v-if="isMockApi" class="card card-pad block block--demo">
      <div class="block__head">
        <p class="card-title">Demo data</p>
        <p class="card-sub">This mockup stores everything in your browser. Reset it to start fresh with the sample accounts.</p>
      </div>
      <button type="button" class="btn btn-danger btn-sm" @click="resetDemo"><RotateCcw :size="15" /> Reset demo data</button>
    </section>

    <div class="logout">
      <button type="button" class="btn btn-ghost" @click="logout"><LogOut :size="17" /> Log out</button>
    </div>

    <UiModal :open="accountOpen" size="lg" label="Open a brokerage account" @close="accountOpen = false">
      <h2 class="h-3">Open your brokerage account</h2>
      <p class="muted modal-sub">About five minutes. After that, investing in any of your theses takes one tap.</p>
      <BrokerageAccountForm @opened="onAccountOpened" />
    </UiModal>
  </div>
</template>

<style scoped>
.settings {
  max-width: 820px;
}
.block {
  margin-bottom: 18px;
}
.block__head {
  margin-bottom: 18px;
}
.block__head--row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.profile {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.profile__bio,
.profile__actions {
  grid-column: 1 / -1;
}
.profile__bio textarea.input {
  min-height: 80px;
}
.handle {
  position: relative;
}
.handle__at {
  position: absolute;
  top: 50%;
  left: 16px;
  transform: translateY(-50%);
  font-weight: 700;
  color: var(--muted);
}
.handle .input {
  padding-left: 34px;
}
.toggles {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.account {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.account .grow {
  display: flex;
  flex-direction: column;
}
.account__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1.5px solid var(--ink-solid);
  border-radius: 12px;
  background: var(--sun);
  color: var(--ink);
}
.block--demo {
  border-style: dashed;
  background: var(--surface-muted);
  box-shadow: none;
}
.logout {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}
.modal-sub {
  margin: 6px 0 18px;
}
@media (max-width: 720px) {
  .profile {
    grid-template-columns: minmax(0, 1fr);
  }
  .block__head--row {
    flex-direction: column;
  }
}
</style>
