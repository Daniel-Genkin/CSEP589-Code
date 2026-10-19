<script setup>
import { authService, isMockApi, portfolioService } from '@/api'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import UiToggle from '@/components/ui/UiToggle.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useAlertsStore } from '@/stores/alerts'
import { useSessionStore } from '@/stores/session'
import { formatMoney, timeAgo } from '@/utils/format'
import { CATEGORIES } from '@/utils/scoring'
import { Check, Link2, LogOut, RotateCcw, Unplug } from '@lucide/vue'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const session = useSessionStore()
const alerts = useAlertsStore()
const toast = useToast()

const profile = reactive({ name: session.user.name, email: session.user.email })
const profileErrors = reactive({})
const savingProfile = ref(false)
const values = ref([...session.user.values])
const savingValues = ref(false)
const prefs = reactive({ ...session.user.preferences })
const { data: connections } = useAsync(() => portfolioService.listConnections())

async function saveProfile() {
  Object.keys(profileErrors).forEach((k) => delete profileErrors[k])
  savingProfile.value = true
  try {
    await session.update({ name: profile.name, email: profile.email })
    toast.success('Profile updated')
  } catch (err) {
    if (err.details) Object.assign(profileErrors, err.details)
    else toast.error("Couldn't save your profile", { description: err.message })
  } finally {
    savingProfile.value = false
  }
}

function toggleValue(key) {
  values.value = values.value.includes(key) ? values.value.filter((k) => k !== key) : [...values.value, key]
}

async function saveValues() {
  savingValues.value = true
  try {
    await session.update({ values: values.value })
    toast.success('Your values are saved', { description: "We'll highlight them across your results." })
  } finally {
    savingValues.value = false
  }
}

async function savePref(key, value) {
  prefs[key] = value
  try {
    await session.update({ preferences: { [key]: value } })
    toast.success('Email preferences saved')
  } catch (err) {
    prefs[key] = !value
    toast.error("Couldn't save that change", { description: err.message })
  }
}

async function disconnect(connection) {
  try {
    await portfolioService.unlink(connection.id)
    connections.value = connections.value.filter((c) => c.id !== connection.id)
    toast.info(`Disconnected ${connection.brokerageName}`, { description: 'We no longer have access to that account.' })
  } catch (err) {
    toast.error("Couldn't disconnect", { description: err.message })
  }
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
  window.location.assign('/')
}
</script>

<template>
  <div class="page settings">
    <header class="page-head">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-sub">Your profile, your values, and how we keep in touch.</p>
      </div>
    </header>

    <section class="card card-pad block">
      <div class="block__head">
        <p class="card-title">Profile</p>
        <p class="card-sub">The basics. We keep it minimal on purpose.</p>
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
        <p class="card-title">Your values</p>
        <p class="card-sub">We'll highlight these in every scan and alert.</p>
      </div>
      <div class="values">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          type="button"
          class="value"
          :class="{ 'is-on': values.includes(cat.key) }"
          :aria-pressed="values.includes(cat.key)"
          @click="toggleValue(cat.key)"
        >
          <CategoryIcon :category="cat.key" :size="36" />
          <span class="value__label">{{ cat.label }}</span>
          <span class="value__check"><Check :size="13" :stroke-width="3" /></span>
        </button>
      </div>
      <button type="button" class="btn btn-primary block__save" :disabled="savingValues" @click="saveValues">
        <span v-if="savingValues" class="spinner" />
        Save values
      </button>
    </section>

    <section class="card card-pad block">
      <div class="block__head">
        <p class="card-title">Email</p>
        <p class="card-sub">
          Monitoring alerts are managed in
          <RouterLink v-if="session.isPro" to="/app/monitoring" class="link">Monitoring</RouterLink>
          <template v-else>Monitoring (Pro)</template>.
        </p>
      </div>
      <div class="toggles">
        <UiToggle
          :model-value="prefs.weeklyRecap"
          label="Weekly recap"
          description="A short Sunday summary of how your holdings are doing on your values."
          @update:model-value="savePref('weeklyRecap', $event)"
        />
        <UiToggle
          :model-value="prefs.productEmails"
          label="Tips & product news"
          description="Bite-sized investing explainers and new features. About twice a month."
          @update:model-value="savePref('productEmails', $event)"
        />
      </div>
    </section>

    <section class="card card-pad block">
      <div class="block__head">
        <p class="card-title">Connected accounts</p>
        <p class="card-sub">Read-only connections to your brokerages.</p>
      </div>
      <ul v-if="connections?.length" class="conns">
        <li v-for="c in connections" :key="c.id" class="conn">
          <span class="conn__mark" :style="{ background: c.color }">{{ c.brokerageName[0] }}</span>
          <span class="grow">
            <strong>{{ c.brokerageName }}</strong>
            <span class="muted text-sm"> · {{ c.holdings.length }} holdings · {{ formatMoney(c.totalValue) }} · synced {{ timeAgo(c.syncedAt) }}</span>
          </span>
          <button type="button" class="btn btn-ghost btn-sm" @click="disconnect(c)"><Unplug :size="15" /> Disconnect</button>
        </li>
      </ul>
      <p v-else class="muted">No accounts connected.</p>
      <RouterLink :to="{ path: '/app/scan/new', query: { mode: 'link' } }" class="btn btn-secondary btn-sm block__save">
        <Link2 :size="15" /> Link an account
      </RouterLink>
    </section>

    <section v-if="isMockApi" class="card card-pad block block--demo">
      <div class="block__head">
        <p class="card-title">Demo data</p>
        <p class="card-sub">This mockup stores everything in your browser. Reset it to start fresh with the sample account.</p>
      </div>
      <button type="button" class="btn btn-danger btn-sm" @click="resetDemo"><RotateCcw :size="15" /> Reset demo data</button>
    </section>

    <div class="logout">
      <button type="button" class="btn btn-ghost" @click="logout"><LogOut :size="17" /> Log out</button>
    </div>
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
.block__save {
  margin-top: 18px;
}
.profile {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.profile__actions {
  grid-column: 1 / -1;
}
.values {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.value {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1.5px solid var(--line);
  border-radius: 16px;
  text-align: left;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}
.value:hover {
  border-color: var(--line-strong);
}
.value.is-on {
  border-color: var(--brand-400);
  background: var(--brand-25);
}
.value__label {
  flex: 1;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.3;
}
.value__check {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1.5px solid var(--line-strong);
  color: transparent;
  transition: all 0.2s;
}
.value.is-on .value__check {
  border-color: var(--brand-600);
  background: var(--brand-600);
  color: #fff;
}
.toggles {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.conn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--line);
}
.conn:first-child {
  border-top: 0;
}
.conn__mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 12px;
  color: #fff;
  font-family: var(--font-display);
  font-weight: 600;
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
@media (max-width: 720px) {
  .profile {
    grid-template-columns: minmax(0, 1fr);
  }
  .values {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .conn {
    flex-wrap: wrap;
  }
}
@media (max-width: 480px) {
  .values {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
