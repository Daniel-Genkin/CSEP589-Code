// The waitlist. There's no backend yet, so signups are only kept in this browser's
// localStorage (demo-grade, like the lines store). Replace `join` with a real POST
// to actually collect them.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const KEY = 'rally.waitlist.v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

export const useWaitlistStore = defineStore('waitlist', () => {
  const emails = ref(load())
  const isOpen = ref(false)
  const joined = computed(() => emails.value.length > 0)

  function join(email) {
    if (!emails.value.includes(email)) emails.value = [...emails.value, email]
    try {
      localStorage.setItem(KEY, JSON.stringify(emails.value))
    } catch {
      // Storage blocked: the signup lasts for this visit only.
    }
  }

  return { emails, isOpen, joined, join }
})
