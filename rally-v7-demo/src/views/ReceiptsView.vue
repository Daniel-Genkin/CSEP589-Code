<script setup>
import AppShell from '../components/AppShell.vue'
import UpdateCard from '../components/UpdateCard.vue'
import Receipt from '../components/Receipt.vue'
</script>

<template>
  <AppShell active="receipts" title="Latest updates." body="News about companies in your fund. Sample data.">
    <div class="grid">
      <div class="col">
        <UpdateCard line="Environment & climate" color="var(--sun)" text="ExxonMobil says it explores for and produces oil and natural gas." tk="XOM" held="3.0% of your VOO" source="corporate.exxonmobil.com" href="https://corporate.exxonmobil.com" />
        <UpdateCard line="Military & defense" color="var(--flare)" text="Lockheed Martin lists the F-35 fighter jet among its programs." tk="LMT" held="In VOO · not in sample" source="lockheedmartin.com/en-us/products/f-35" href="https://www.lockheedmartin.com/en-us/products/f-35.html" />
      </div>
      <aside class="side">
        <h3 class="h">Your fund receipt</h3>
        <div class="paper"><Receipt mode="per100" :rotate="2" meta="Fund receipt · VOO" other-label="Not shown" footer="Sample data" /></div>
        <h3 class="h" style="margin-top: 20px">Share your receipt</h3>
        <p class="dim">Show friends what’s in your fund. Only holdings and your lines are shared, never balances or returns.</p>
        <div class="btns">
          <RouterLink to="/check/receipt?dialog=share" class="btn btn-secondary">Share Receipt</RouterLink>
          <RouterLink to="/check/receipt?dialog=share" class="btn btn-secondary">Export Image</RouterLink>
        </div>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col { display: flex; flex-direction: column; gap: 14px; }
.side { display: flex; flex-direction: column; gap: 12px; }
.h { font-weight: 600; font-size: 20px; color: var(--white); }
.paper { display: flex; justify-content: center; padding: 20px 0; }
.paper :deep(.receipt) { width: 320px; }
.side .dim { font-size: 15px; line-height: 1.45; }
.btns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
</style>
