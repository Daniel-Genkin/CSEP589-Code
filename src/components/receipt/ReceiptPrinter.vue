<script setup>
// The printer head the receipt paper feeds out of. Also pulls in the paper's styles.
import { BRAND_NAME } from '@/config/brand'
import '@/styles/receipt.css'
</script>

<template>
  <div class="rc-printer" aria-hidden="true">
    <span class="rc-printer-name">{{ BRAND_NAME.toUpperCase() }}-O-MATIC</span>
    <span class="rc-led"></span>
    <span class="rc-slot"></span>
  </div>
</template>
