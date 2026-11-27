<script setup>
import AppShell from '../components/AppShell.vue'
import DotGrid from '../components/DotGrid.vue'
import Receipt from '../components/Receipt.vue'
</script>

<template>
  <AppShell active="home" glow="green">
    <div class="grid">
      <div class="col">
        <span class="ok mono"><i class="dot" style="background: var(--green)" /> No conflicts found</span>
        <p class="label">Results ready · Sample data</p>
        <p class="display zero">0%</p>
        <p class="lead">You’re all clear.</p>
        <p class="dim">None of your money in VOO goes to companies that cross your 2 lines. You’ll get an update if that changes.</p>
        <div class="card-pad">
          <div class="sh"><b>Where every $100 goes</b><span style="color: var(--green); font-size: 13px">All 100 clear</span></div>
          <DotGrid :segments="[{ n: 100, color: 'var(--green)' }]" :size="28" :gap="10" />
          <p class="caption">Sample scenario, not VOO’s real holdings.</p>
        </div>
        <h3 class="h">What this scan covers</h3>
        <p class="dim">This only checks Military &amp; defense and Labor practices, using sample data. It isn’t an endorsement of VOO or the companies in it.</p>
      </div>
      <aside class="col">
        <h3 class="h">Your fund receipt</h3>
        <div class="paper">
          <Receipt :rotate="2" meta="Fund receipt · VOO" :rows="[{ label: 'Checked lines', amount: '2' }, { label: 'Matched companies', amount: '0' }]" total="$0.00" total-sub="per $100 in VOO" rest="$100.00" total-color="var(--ink)" footer="No matches" />
        </div>
        <div class="btns"><RouterLink to="/check/receipt?dialog=share" class="btn btn-primary">Share Receipt</RouterLink><RouterLink to="/check/receipt?dialog=share" class="btn btn-secondary">Export</RouterLink></div>
        <p class="caption">Shares holdings and lines only, never balances or returns.</p>
        <div class="card-pad">
          <div class="sh"><b>Your lines</b><span class="caption">2 lines</span></div>
          <div class="chips"><span class="chip"><i class="dot" style="background: var(--flare)" />Military &amp; defense</span><span class="chip"><i class="dot" style="background: var(--signal)" />Labor practices</span></div>
          <p class="dim">Add more lines for a wider check.</p>
          <RouterLink to="/lines" class="btn btn-secondary" style="align-self: flex-start; height: 44px; font-size: 15px">Edit Lines</RouterLink>
        </div>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col { display: flex; flex-direction: column; gap: 14px; }
.ok { align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(75, 214, 126, 0.12); color: var(--green); font-weight: 500; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
.zero { font-size: 190px; color: var(--green); }
.lead { font-weight: 500; font-size: 26px; color: var(--white); }
.sh { display: flex; justify-content: space-between; align-items: baseline; }
.sh b { font-weight: 600; font-size: 17px; color: var(--white); }
.h { font-weight: 600; font-size: 20px; color: var(--white); margin-top: 8px; }
.paper { display: flex; justify-content: center; padding: 14px 0; }
.btns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { height: 34px; font-size: 14px; background: #2f2c38; }
</style>
