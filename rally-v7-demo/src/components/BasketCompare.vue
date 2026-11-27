<template>
  <div class="card-pad compare">
    <div class="top">
      <div>
        <p class="label">VOO today</p>
        <p class="display pct">13%</p>
        <p class="s">crosses your lines<br />503 companies</p>
      </div>
      <span class="arrow">→</span>
      <div>
        <p class="label">Your basket</p>
        <p class="display pct mine">10.3%</p>
        <p class="s">crosses your lines<br />502 companies</p>
      </div>
    </div>
    <hr class="rule" />
    <p class="gap"><span class="display">0.4 pts</span> behind the S&amp;P 500 in 2025</p>
    <div class="bar-row"><span>Sample basket</span><span class="mono">+9.6%</span></div>
    <div class="track"><span style="width: 74%; background: var(--sun)" /></div>
    <div class="bar-row"><span>S&amp;P 500</span><span class="mono">+10.0%</span></div>
    <div class="track"><span style="width: 77%; background: #8a8594" /></div>
    <p class="caption">How the basket would have done in 2025, using sample data. Not a prediction.</p>
  </div>
</template>

<style scoped>
.compare { gap: 10px; }
.top { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; }
.pct { font-size: 44px; color: var(--cream); margin: 6px 0 4px; }
.pct.mine { color: var(--link); }
.s { font-size: 13px; color: var(--dim); line-height: 1.35; }
.arrow { color: var(--dim); font-size: 18px; }
.gap { display: flex; align-items: baseline; gap: 10px; font-weight: 500; font-size: 14px; color: var(--white); }
.gap .display { font-size: 32px; color: var(--cream); text-transform: none; }
.bar-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--dim); margin-top: 4px; }
.bar-row .mono { color: var(--white); }
.track { height: 6px; border-radius: 3px; background: #34313d; }
.track span { display: block; height: 100%; border-radius: 3px; }
</style>
