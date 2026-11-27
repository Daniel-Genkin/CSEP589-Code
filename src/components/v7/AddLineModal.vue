<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'
import Field from './Field.vue'
import { useCheckStore } from '@/state/check'

const check = useCheckStore()

const emit = defineEmits(['close'])
const name = ref('Private prisons')
function add() {
  const n = name.value.trim()
  if (n && !check.customLines.includes(n)) check.customLines.push(n)
  emit('close')
}
</script>

<template>
  <Modal title="Add your own line" @close="emit('close')">
    <p class="dim body">Name something you don’t want to fund. Rally looks for companies tied to it in public records.</p>
    <Field v-model="name" label="Your line" autofocus />
    <p class="caption">If there isn’t enough on record, Rally tells you instead of guessing.</p>
    <button class="btn btn-primary btn-block" @click="add">Add Line</button>
    <button class="btn-link" style="align-self: flex-start" @click="emit('close')">Cancel</button>
  </Modal>
</template>

<style scoped>
.body { font-size: 15px; line-height: 1.45; }
</style>
