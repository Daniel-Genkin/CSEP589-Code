// Climate collection: what the mock copilot knows about each sub-theme. All evidence and news is illustrative.
// keywords: matched against the user's idea to pick a topic (most matches wins, ties go to the earlier topic).
// claims: what must be true for the thesis to pay off. Each check cites a source type: filings, policy or adoption data.
// basket: the companies most exposed to the idea (see companies.js). alpha: the topic's synthetic yearly drift vs the market.
// news: pool the alerts "check" endpoint draws from. Each item names the claim it strengthens or weakens.

export const TOPICS = [
  {
    key: 'heat-pumps',
    label: 'Building electrification',
    short: 'Heat pumps',
    keywords: /heat ?pumps?|furnaces?|\bhvac\b|boilers?|gas stoves?|induction|electrif|retrofits?|insulation|thermostats?|mini-?splits?|home heating|space heating/gi,
    title: 'Heat pumps beat the furnace',
    statement:
      'Heat pumps will replace gas furnaces in U.S. homes faster than the market expects {horizon}, growing revenue for the equipment makers, suppliers and installers most exposed to the switch.',
    claims: [
      {
        id: 'c1',
        text: 'Heat pumps keep taking share from gas furnaces.',
        status: 'supported',
        checks: [
          { source: 'adoption', finding: 'Heat pumps outsold gas furnaces in each of the last three years, and the gap widened every year.' },
          { source: 'filings', finding: 'Thermiq and Airwell both report heat pumps as their fastest-growing line. Thermiq’s furnace sales fell 9% last year.' },
        ],
      },
      {
        id: 'c2',
        text: 'Running a heat pump costs less than heating with gas for most households.',
        status: 'mixed',
        checks: [
          { source: 'adoption', finding: 'Running costs come out lower in mild and mid-cold climates. Where gas is cheap and power is pricey, the savings shrink or vanish.' },
          { source: 'policy', finding: 'Some utilities offer lower winter rates for heat pump homes, but only a minority of customers can get them.' },
        ],
      },
      {
        id: 'c3',
        text: 'Policy keeps nudging buildings off gas, even with less federal help.',
        status: 'mixed',
        checks: [
          { source: 'policy', finding: 'Several states fund heat pump rebates and installation goals. Federal incentives are less certain than they were, so state and utility money does more of the work.' },
          { source: 'adoption', finding: 'More cities limit gas hookups in new buildings, though some of those rules face legal challenges.' },
        ],
      },
      {
        id: 'c4',
        text: 'Makers and installers can grow without crushing their margins.',
        status: 'supported',
        checks: [
          { source: 'filings', finding: 'Thermiq’s heat pump margins run 4 points above its furnace margins, and HomeRev’s backlog has grown six quarters in a row.' },
          { source: 'adoption', finding: 'Installer training programs are growing, but contractor capacity is still the main bottleneck in cold states.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'Cold snaps and power bills',
        text: 'If electricity prices climb faster than gas prices, the savings case weakens and homeowners stick with furnaces. A deep freeze with bad press can stall sales for a season.',
      },
      {
        title: 'Not enough installers',
        text: 'Demand can outrun the number of trained installers. That caps growth and pushes up install prices, which hurts installers like HomeRev more than equipment makers.',
      },
      {
        title: 'Incentives can disappear',
        text: 'Rebates and gas rules change with elections. Without them, the upfront cost (often two to three times a furnace) becomes the deciding factor again.',
      },
    ],
    basket: ['AIRW', 'THRM', 'HOMR', 'PANL', 'HRTH', 'CHLW', 'WATT', 'COPR'],
    alpha: 0.035,
    watch: 'quarterly heat pump vs. furnace shipments, and winter electricity prices',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c3',
        title: 'Two more states set heat pump installation targets',
        summary: 'New state rebate money supports the policy claim in your thesis.',
        whatHappened:
          'Two Northeastern states set targets to install a combined 600,000 heat pumps by 2030, paid for with utility rebates. State programs like these have driven most new sales as federal support faded.',
        companies: ['THRM', 'AIRW', 'HOMR'],
        source: 'GreenWire Daily',
        action: 'No action needed. This supports claim 3, which the copilot marked as mixed.',
      },
      {
        kind: 'weakens',
        claimId: 'c4',
        title: 'Thermiq warns that compressor costs are squeezing margins',
        summary: 'Higher part costs test the claim that makers can grow without crushing margins.',
        whatHappened:
          'Thermiq told investors that compressor prices rose 12% this quarter and it will only pass part of that on to customers. It kept its sales forecast but cut its margin outlook.',
        companies: ['THRM', 'COIL'],
        source: 'Market Pulse',
        action: 'Worth a look. Ask the copilot whether to trim Thermiq or lean on suppliers like Coilbridge, which benefit from higher compressor prices.',
      },
    ],
  },
  {
    key: 'ev',
    label: 'EVs & charging',
    short: 'EVs',
    keywords: /\bevs?\b|electric (?:cars?|vehicles?|trucks?|buses?|vans?|delivery)|\btrucks?\b|charg(?:ing|ers?)|automakers?|e-?bikes?|\bfleets?\b|gas cars?/gi,
    title: 'EVs win the road',
    statement:
      'Electric vehicles will take a bigger share of new vehicle sales than the market expects {horizon}, and the companies that build, charge and supply them will grow with it.',
    claims: [
      {
        id: 'c1',
        text: 'EVs keep taking share of new vehicle sales.',
        status: 'mixed',
        checks: [
          { source: 'adoption', finding: 'EV share of new sales keeps rising worldwide, but U.S. growth slowed as automakers delayed some models.' },
          { source: 'filings', finding: 'Voltway’s deliveries grew 18% last year, down from a 40% pace two years earlier.' },
        ],
      },
      {
        id: 'c2',
        text: 'Owning an EV gets cheaper than owning a gas car.',
        status: 'supported',
        checks: [
          { source: 'adoption', finding: 'Battery prices have fallen sharply over the past decade, and several EVs now cost about the same as similar gas cars over five years of ownership.' },
          { source: 'filings', finding: 'Ampera says its newest cells cost 14% less per kWh than the previous generation.' },
        ],
      },
      {
        id: 'c3',
        text: 'Public charging grows fast enough to keep up.',
        status: 'mixed',
        checks: [
          { source: 'adoption', finding: 'Fast-charger counts are growing quickly, but reliability complaints and rural gaps are still common.' },
          { source: 'policy', finding: 'Public money for charging exists, but rollout has been slower than planned in many states.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'Price wars eat profits',
        text: 'EV sales can grow while profits fall. Automakers keep cutting prices to win buyers, and that’s what hit Voltway’s stock last year.',
      },
      {
        title: 'Hybrids take the middle',
        text: 'Many buyers are choosing hybrids as a halfway step. If that lasts, full EV growth could stay slower than the bullish forecasts.',
      },
      {
        title: 'Policy whiplash',
        text: 'Tax credits, emissions rules and tariffs can change quickly, and each change shifts what EVs cost buyers.',
      },
    ],
    basket: ['VOLT', 'CHRG', 'HAUL', 'MTVO', 'AMPX', 'SALR', 'CHIP'],
    alpha: -0.03,
    watch: 'monthly EV share of new sales, and charger uptime',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c3',
        title: 'ChargeGrid’s network hits 99% uptime for the first time',
        summary: 'Better charger reliability supports the charging claim in your thesis.',
        whatHappened:
          'ChargeGrid reported that 99% of its fast chargers worked on the first try last quarter, up from 91% a year ago, after replacing older hardware across its network.',
        companies: ['CHRG'],
        source: 'Charge Weekly',
        action: 'No action needed. This supports claim 3, the weakest link in most EV theses.',
      },
      {
        kind: 'weakens',
        claimId: 'c1',
        title: 'Two automakers push back EV launches to 2028',
        summary: 'Delayed models test the claim that EVs keep taking share.',
        whatHappened:
          'Two large automakers delayed five electric models by up to two years, citing slower demand. Both said they’ll build more hybrids in the meantime.',
        companies: ['MTVO', 'AMPX'],
        source: 'Auto Ledger',
        action: 'Worth a look. Ask the copilot how exposed your suppliers are to these automakers.',
      },
    ],
  },
  {
    key: 'solar',
    label: 'Solar',
    short: 'Solar',
    keywords: /solar|photovoltaic|\bpv\b|rooftops?|sunshine/gi,
    title: 'Solar everywhere',
    statement:
      'Solar will be the cheapest and fastest-growing source of new U.S. power {horizon}, rewarding the panel makers, trackers and developers most exposed to the build-out.',
    claims: [
      {
        id: 'c1',
        text: 'Solar stays the cheapest new power to build.',
        status: 'supported',
        checks: [
          { source: 'adoption', finding: 'New utility-scale solar is among the cheapest sources of new electricity in most regions, and adding batteries keeps getting cheaper.' },
          { source: 'filings', finding: 'Solara signed 3.1 GW of new long-term contracts last year at prices below new gas plants.' },
        ],
      },
      {
        id: 'c2',
        text: 'U.S.-made panels can compete on price.',
        status: 'weak',
        checks: [
          { source: 'filings', finding: 'Helio’s factory costs are still about 20% above imported panels, and it relies on trade protections to compete.' },
          { source: 'policy', finding: 'Tariffs on imported panels help domestic makers, but they can be changed or challenged.' },
        ],
      },
      {
        id: 'c3',
        text: 'The grid can connect new solar farms fast enough.',
        status: 'mixed',
        checks: [
          { source: 'adoption', finding: 'Huge amounts of solar are waiting in line for grid connections, and many queued projects never get built.' },
          { source: 'policy', finding: 'Regulators ordered faster connection reviews, but results so far are uneven.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'Cheap power, thin profits',
        text: 'Solar can win on cost and still be a tough business. Falling panel prices squeeze manufacturers, and high interest rates hurt developers that borrow to build.',
      },
      {
        title: 'Stuck in the queue',
        text: 'If projects wait years for a grid connection, the growth shows up later than your thesis expects.',
      },
      {
        title: 'Trade rules cut both ways',
        text: 'Tariffs protect U.S. factories but raise costs for the developers and installers in the same basket.',
      },
    ],
    basket: ['SOLR', 'HELI', 'INVT', 'RAYS', 'SNWD', 'POLY'],
    alpha: -0.05,
    watch: 'interconnection queue times, and U.S. panel prices',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c3',
        title: 'Regulators approve a fast-track lane for solar plus storage',
        summary: 'Faster grid connections support the claim that new farms can plug in quickly.',
        whatHappened:
          'A regional grid operator approved a fast-track review for solar farms that include batteries, cutting expected connection times roughly in half for qualifying projects.',
        companies: ['SOLR', 'RAYS'],
        source: 'GreenWire Daily',
        action: 'No action needed. This supports claim 3, which the copilot marked as mixed.',
      },
      {
        kind: 'weakens',
        claimId: 'c2',
        title: 'Helio delays its second Texas factory',
        summary: 'A factory delay tests the claim that U.S.-made panels can compete.',
        whatHappened:
          'Helio pushed back its second Texas factory by a year, saying imported panel prices fell faster than expected and made the new line harder to justify.',
        companies: ['HELI', 'POLY'],
        source: 'Market Pulse',
        action: 'Worth a look. Ask the copilot whether to lean toward developers and trackers over panel makers.',
      },
    ],
  },
  {
    key: 'wind',
    label: 'Wind',
    short: 'Wind',
    keywords: /\bwind\b|turbines?|offshore/gi,
    title: 'Wind’s second wind',
    statement:
      'Wind power will recover from its slump and grow faster than the market expects {horizon}, led by the turbine makers, developers and cable suppliers most exposed to new builds.',
    claims: [
      {
        id: 'c1',
        text: 'Turbine makers can make money again.',
        status: 'mixed',
        checks: [
          { source: 'filings', finding: 'Galeforce returned to a small operating profit after two years of losses, helped by higher prices on new contracts.' },
          { source: 'adoption', finding: 'Onshore turbine orders picked up last year, while offshore orders stayed flat.' },
        ],
      },
      {
        id: 'c2',
        text: 'Offshore wind projects get built on time.',
        status: 'weak',
        checks: [
          { source: 'adoption', finding: 'Several large offshore projects were canceled or delayed over the past few years after costs rose.' },
          { source: 'policy', finding: 'Federal permitting for offshore wind has become less predictable, and some approved projects face new reviews.' },
        ],
      },
      {
        id: 'c3',
        text: 'Demand for clean power keeps rising.',
        status: 'supported',
        checks: [
          { source: 'adoption', finding: 'Corporate buyers, led by data centers, are signing more long-term clean power contracts than ever.' },
          { source: 'filings', finding: 'Westwind signed 1.4 GW of contracts with two tech companies this year.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'Offshore is fragile',
        text: 'One canceled offshore project can wipe out a year of backlog for cable and installation companies like Seaway and Harborline.',
      },
      {
        title: 'Interest rates bite',
        text: 'Wind farms are mostly upfront cost, so higher interest rates hit them harder than gas plants.',
      },
      {
        title: 'Permits and politics',
        text: 'Wind projects face local opposition and shifting federal permitting, which can stall approvals for years.',
      },
    ],
    basket: ['GALE', 'WSTW', 'NSEA', 'BLDE', 'HRBR', 'COPR'],
    alpha: -0.06,
    watch: 'turbine orders, and the status of offshore permits',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c3',
        title: 'Data center operator signs a record wind power contract',
        summary: 'More corporate demand supports the claim that clean power demand keeps rising.',
        whatHappened:
          'A data center operator agreed to buy power from 2 GW of new Westwind farms for 18 years, the largest wind contract a single buyer has signed.',
        companies: ['WSTW', 'GALE'],
        source: 'Power Desk',
        action: 'No action needed. This supports claim 3, your strongest claim.',
      },
      {
        kind: 'weakens',
        claimId: 'c2',
        title: 'Offshore wind project paused for a federal review',
        summary: 'Another pause tests the claim that offshore projects get built on time.',
        whatHappened:
          'A permitted offshore wind farm was ordered to pause construction during a new federal review. The developer says the delay could last six months or more.',
        companies: ['NSEA', 'HRBR'],
        source: 'Coastal Ledger',
        action: 'Worth a look. Ask the copilot about trimming offshore-only names like Harborline.',
      },
    ],
  },
  {
    key: 'storage',
    label: 'Batteries & storage',
    short: 'Storage',
    keywords: /batter(?:y|ies)|storage|sodium|iron-air|long-duration|li-?ion|lithium-ion|megapacks?/gi,
    title: 'Batteries run the grid',
    statement:
      'Battery storage will become standard on the grid and in homes {horizon}, and newer chemistries like sodium-ion will win share faster than the market expects.',
    claims: [
      {
        id: 'c1',
        text: 'Grid batteries keep getting cheaper and more useful.',
        status: 'supported',
        checks: [
          { source: 'adoption', finding: 'Utility battery installs have grown fast for several years, and batteries now help cover evening demand peaks.' },
          { source: 'filings', finding: 'Stackwell’s backlog rose to 9 GWh, and its average project size doubled.' },
        ],
      },
      {
        id: 'c2',
        text: 'Newer chemistries can match lithium-ion on cost.',
        status: 'weak',
        checks: [
          { source: 'filings', finding: 'Saltwave’s cells cost about 10% more than lithium iron phosphate today. It expects to match them only after its second factory opens.' },
          { source: 'adoption', finding: 'Sodium-ion is still a tiny share of battery shipments.' },
        ],
      },
      {
        id: 'c3',
        text: 'Utilities and regulators pay for storage.',
        status: 'mixed',
        checks: [
          { source: 'policy', finding: 'Several states have storage targets, and grid operators are adding ways to pay batteries for backup capacity.' },
          { source: 'adoption', finding: 'Where those payments don’t exist, batteries earn money mostly from price swings, which are harder to count on.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'Lithium got cheap',
        text: 'Lithium prices fell sharply, which makes it harder for alternatives like sodium-ion to win on cost.',
      },
      {
        title: 'Batteries are becoming a commodity',
        text: 'Lots of companies can assemble battery systems, which pushes prices and margins down for everyone.',
      },
      {
        title: 'Fire and safety rules',
        text: 'A high-profile battery fire can trigger stricter local rules and slow approvals.',
      },
    ],
    basket: ['STOR', 'AMPX', 'SWAV', 'IRFL', 'INVT', 'SOLR', 'CYCL'],
    alpha: -0.01,
    watch: 'battery cell prices, and new capacity payments from grid operators',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c3',
        title: 'Grid operator approves new payments for backup batteries',
        summary: 'A new revenue stream supports the claim that utilities will pay for storage.',
        whatHappened:
          'A large regional grid operator approved payments for batteries that stay ready to cover demand peaks, giving storage projects a steadier source of income.',
        companies: ['STOR', 'IRFL'],
        source: 'Power Desk',
        action: 'No action needed. This supports claim 3, which the copilot marked as mixed.',
      },
      {
        kind: 'weakens',
        claimId: 'c2',
        title: 'Saltwave pushes back its second factory',
        summary: 'A delay tests the claim that newer chemistries can match lithium-ion on cost.',
        whatHappened:
          'Saltwave delayed its second sodium-ion factory by nine months, which pushes back the scale it needs to match lithium iron phosphate on cost.',
        companies: ['SWAV'],
        source: 'Battery Brief',
        action: 'Worth a look. Ask the copilot whether to trim Saltwave or keep it as your highest-conviction pick.',
      },
    ],
  },
  {
    key: 'nuclear',
    label: 'Nuclear',
    short: 'Nuclear',
    keywords: /nuclear|\bsmrs?\b|reactors?|uranium|fission|fusion/gi,
    title: 'The nuclear comeback',
    statement:
      'Nuclear power will come back faster than the market expects {horizon}, as power-hungry data centers pay for reactor restarts, license extensions and the first small modular reactors.',
    claims: [
      {
        id: 'c1',
        text: 'Big power buyers will pay extra for always-on clean power.',
        status: 'supported',
        checks: [
          { source: 'adoption', finding: 'Several large tech companies have signed long-term deals for nuclear power, including deals tied to restarting or extending existing plants.' },
          { source: 'filings', finding: 'Cascade Power & Light says two data-center customers asked to buy power directly from its reactors.' },
        ],
      },
      {
        id: 'c2',
        text: 'Existing reactors keep running longer.',
        status: 'supported',
        checks: [
          { source: 'policy', finding: 'Regulators have approved license extensions that let some reactors run for up to 80 years.' },
          { source: 'filings', finding: 'Atlas Nuclear Services has upgrade contracts at 9 plants that are extending their lives.' },
        ],
      },
      {
        id: 'c3',
        text: 'Small modular reactors get built on time and on budget.',
        status: 'weak',
        checks: [
          { source: 'filings', finding: 'Corefield’s first plant is 14 months behind schedule, and its cost estimate rose 30%.' },
          { source: 'adoption', finding: 'No small modular reactor is selling power commercially in the U.S. yet.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'Delays are the norm',
        text: 'New nuclear projects have a long history of running years late and far over budget, and small reactors are still unproven at scale.',
      },
      {
        title: 'Uranium swings',
        text: 'Uranium prices can move wildly, which makes fuel companies like Uranex volatile even if the thesis is right.',
      },
      {
        title: 'One accident changes everything',
        text: 'Public opinion on nuclear can turn quickly after an incident anywhere in the world.',
      },
    ],
    basket: ['URNX', 'CRFN', 'ATNS', 'KSTN', 'CSPL', 'TRFM'],
    alpha: 0.05,
    watch: 'new nuclear power deals, and Corefield’s construction milestones',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c1',
        title: 'Cloud company signs a 20-year deal for Cascade’s nuclear power',
        summary: 'A long contract supports the claim that big buyers will pay extra for nuclear.',
        whatHappened:
          'A cloud company agreed to buy power from one of Cascade Power & Light’s reactors for 20 years at a premium to market prices, helping pay for a license extension.',
        companies: ['CSPL', 'URNX'],
        source: 'Power Desk',
        action: 'No action needed. This supports claim 1, your strongest claim.',
      },
      {
        kind: 'weakens',
        claimId: 'c3',
        title: 'Corefield’s first reactor faces another delay',
        summary: 'A new delay tests the claim that small reactors get built on time.',
        whatHappened:
          'Corefield said its first small modular reactor will start up a year later than planned after a key component failed testing.',
        companies: ['CRFN', 'KSTN'],
        source: 'Atomic Ledger',
        action: 'Worth a look. Ask the copilot whether to shift weight from Corefield toward existing-reactor names.',
      },
    ],
  },
  {
    key: 'hydrogen',
    label: 'Hydrogen',
    short: 'Hydrogen',
    keywords: /hydrogen|electroly[sz]ers?|fuel cells?|ammonia|\bh2\b/gi,
    title: 'Green hydrogen for heavy industry',
    statement:
      'Green hydrogen will find its market in heavy industry like fertilizer, steel and shipping faster than the market expects {horizon}, lifting the companies that make, move and use it.',
    claims: [
      {
        id: 'c1',
        text: 'Green hydrogen gets cheap enough to compete.',
        status: 'weak',
        checks: [
          { source: 'adoption', finding: 'Green hydrogen still costs several times more than hydrogen made from natural gas in most places.' },
          { source: 'filings', finding: 'Hydrolyte says its newest electrolyzer cuts costs 20%, but customers delayed three of its five largest orders.' },
        ],
      },
      {
        id: 'c2',
        text: 'Heavy industry commits to buying it.',
        status: 'mixed',
        checks: [
          { source: 'filings', finding: 'Greenport and Verdant signed 10-year purchase agreements, but most deals are still early-stage letters of intent.' },
          { source: 'adoption', finding: 'Most announced green hydrogen projects haven’t reached a final decision to build.' },
        ],
      },
      {
        id: 'c3',
        text: 'Policy support lasts long enough for costs to fall.',
        status: 'mixed',
        checks: [
          { source: 'policy', finding: 'Several countries offer hydrogen production incentives, but rules and timelines keep changing.' },
          { source: 'adoption', finding: 'Europe and parts of Asia are funding hydrogen hubs more aggressively than the U.S.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'Cheaper alternatives',
        text: 'For cars, heating and many factories, batteries and direct electrification are cheaper than hydrogen, which shrinks the market.',
      },
      {
        title: 'Projects stall on paper',
        text: 'Most announced projects haven’t been built. If they never are, electrolyzer makers like Hydrolyte have nobody to sell to.',
      },
      {
        title: 'Cash burn',
        text: 'Several companies in this basket aren’t profitable yet and may need to raise money, which dilutes shareholders.',
      },
    ],
    basket: ['HYLY', 'CLST', 'GPAM', 'NSIG', 'VRDF', 'WSTW'],
    alpha: -0.12,
    watch: 'final build decisions on hydrogen projects, and electrolyzer orders',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c2',
        title: 'Steelmaker signs a 15-year green hydrogen supply deal',
        summary: 'A binding contract supports the claim that heavy industry will commit.',
        whatHappened:
          'A steelmaker signed a binding 15-year contract to buy green hydrogen from a Northstar plant, one of the first deals of its size to move past a letter of intent.',
        companies: ['NSIG', 'HYLY'],
        source: 'Industry Ledger',
        action: 'No action needed. This supports claim 2, which the copilot marked as mixed.',
      },
      {
        kind: 'weakens',
        claimId: 'c1',
        title: 'Hydrolyte’s largest customer cancels an electrolyzer order',
        summary: 'A canceled order tests the claim that green hydrogen gets cheap enough to compete.',
        whatHappened:
          'Hydrolyte’s largest customer canceled a 200 MW electrolyzer order, saying green hydrogen still costs too much compared with hydrogen made from gas.',
        companies: ['HYLY'],
        source: 'Market Pulse',
        action: 'Worth a look. Ask the copilot whether this changes your highest-risk claim.',
      },
    ],
  },
  {
    key: 'carbon',
    label: 'Carbon removal',
    short: 'Carbon removal',
    keywords: /carbon (?:capture|removal|credits?|offsets?|markets?)|direct air capture|\bdac\b|\bccs\b|sequest|biochar|co2 removal|negative emissions/gi,
    title: 'Carbon removal goes big',
    statement:
      'Paying to pull carbon out of the air will grow into a real market faster than the market expects {horizon}, rewarding the companies that capture, store and verify it.',
    claims: [
      {
        id: 'c1',
        text: 'Companies keep buying carbon removal.',
        status: 'mixed',
        checks: [
          { source: 'adoption', finding: 'Large tech companies have signed big removal deals, but most purchases come from a handful of buyers.' },
          { source: 'filings', finding: 'Skyscrub’s backlog is $1.2B, but 70% of it comes from two buyers.' },
        ],
      },
      {
        id: 'c2',
        text: 'Removal costs fall fast enough.',
        status: 'weak',
        checks: [
          { source: 'filings', finding: 'Skyscrub’s cost per ton is still above $400. It targets $150 by 2032.' },
          { source: 'adoption', finding: 'Cheaper methods like biochar and rock weathering are scaling faster than machines that capture CO₂ from the air.' },
        ],
      },
      {
        id: 'c3',
        text: 'Carbon credits become trustworthy.',
        status: 'mixed',
        checks: [
          { source: 'policy', finding: 'Standards for measuring and verifying removals are being written, but they aren’t settled yet.' },
          { source: 'adoption', finding: 'Past scandals over low-quality offsets still make some buyers cautious.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'Too few buyers',
        text: 'If one or two big buyers pull back, demand could drop fast.',
      },
      {
        title: 'The trust problem',
        text: 'Another scandal over bad credits could hit the whole market, including Ledgerleaf’s marketplace.',
      },
      {
        title: 'Very early companies',
        text: 'Most companies in this basket are small and unprofitable, so their stocks can swing hard.',
      },
    ],
    basket: ['SKYC', 'TVLT', 'CHAR', 'BSLT', 'LDGR', 'NSIG'],
    alpha: -0.07,
    watch: 'the number of buyers signing removal deals, and cost per ton',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c3',
        title: 'New verification standard for carbon removal gets final approval',
        summary: 'A shared standard supports the claim that credits become trustworthy.',
        whatHappened:
          'An industry standards body approved final rules for measuring and verifying carbon removal, which several large buyers said they would require for future purchases.',
        companies: ['LDGR', 'CHAR'],
        source: 'Carbon Brief Weekly',
        action: 'No action needed. This supports claim 3, which the copilot marked as mixed.',
      },
      {
        kind: 'weakens',
        claimId: 'c1',
        title: 'A big buyer pauses new carbon removal purchases',
        summary: 'A pause from a major buyer tests the claim that companies keep buying removal.',
        whatHappened:
          'One of the largest buyers of carbon removal said it will pause new purchases for a year while it reviews its climate targets.',
        companies: ['SKYC', 'BSLT'],
        source: 'Market Pulse',
        action: 'Worth a look. Ask the copilot how concentrated your basket is on a few buyers.',
      },
    ],
  },
  {
    key: 'food',
    label: 'Food & farming',
    short: 'Food',
    keywords: /plant-?based|\bmeat\b|beef|cattle|\bcows?\b|dairy|proteins?|regenerative|\bfarm(?:s|ing|land|ers)?\b|agricultur|fertili[sz]er|\bfood\b|\bcrops?\b|lab-?grown|cultivated/gi,
    title: 'Low-carbon food goes mainstream',
    statement:
      'Low-carbon food, from alternative proteins to precision farming and greener fertilizer, will grow faster than the market expects {horizon} as food brands race to hit their climate targets.',
    claims: [
      {
        id: 'c1',
        text: 'Food brands pay more for low-carbon ingredients.',
        status: 'mixed',
        checks: [
          { source: 'filings', finding: 'Verdant sells its low-carbon fertilizer at an 8% premium, but only to a few large brands.' },
          { source: 'adoption', finding: 'Many big food companies have climate targets that cover their farm supply chains.' },
        ],
      },
      {
        id: 'c2',
        text: 'Alternative proteins keep winning shoppers.',
        status: 'weak',
        checks: [
          { source: 'adoption', finding: 'Plant-based meat sales fell from their peak, while plant-based milk held steady.' },
          { source: 'filings', finding: 'Greenbloom’s growth now comes mostly from milks and snacks, not meat substitutes.' },
        ],
      },
      {
        id: 'c3',
        text: 'Farm tech saves farmers money.',
        status: 'supported',
        checks: [
          { source: 'filings', finding: 'Fieldsense customers cut fertilizer use about 15% on average, and over 90% renew.' },
          { source: 'adoption', finding: 'Precision farming tools are spreading fastest on large farms, where the savings are biggest.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'Shoppers follow price',
        text: 'Most shoppers choose on price and taste. If low-carbon options cost more, sales stall.',
      },
      {
        title: 'Farm incomes swing',
        text: 'When crop prices fall, farmers cut spending on new technology first.',
      },
      {
        title: 'Slow-moving giants',
        text: 'Big food companies can push back their climate targets without much penalty.',
      },
    ],
    basket: ['GRNB', 'CLTV', 'FLDS', 'VRDF', 'RSTK', 'FRST'],
    alpha: -0.06,
    watch: 'premiums paid for low-carbon ingredients, and plant-based sales trends',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c3',
        title: 'Fieldsense signs its largest farm co-op yet',
        summary: 'A big new customer supports the claim that farm tech saves farmers money.',
        whatHappened:
          'A farm co-op covering 4 million acres signed a five-year deal with Fieldsense after a pilot cut its members’ fertilizer bills by 17%.',
        companies: ['FLDS'],
        source: 'AgWire',
        action: 'No action needed. This supports claim 3, your strongest claim.',
      },
      {
        kind: 'weakens',
        claimId: 'c2',
        title: 'Plant-based meat sales slip again',
        summary: 'Falling sales test the claim that alternative proteins keep winning shoppers.',
        whatHappened:
          'Grocery data showed plant-based meat sales down 6% from a year ago, the third straight yearly decline, while plant-based milk sales were flat.',
        companies: ['GRNB', 'CLTV'],
        source: 'Consumer Watch',
        action: 'Worth a look. Ask the copilot whether to shift weight from proteins toward farm tech.',
      },
    ],
  },
  {
    key: 'materials',
    label: 'Critical minerals & materials',
    short: 'Materials',
    keywords: /lithium|copper|nickel|cobalt|critical minerals?|\bmin(?:ing|es|ers)\b|recycl|\bsteel\b|cement|concrete|rare earths?/gi,
    title: 'Recycling beats mining',
    statement:
      'The materials behind the energy transition, like lithium, copper and low-carbon steel, will be scarcer than the market expects {horizon}, rewarding the recyclers and producers who can deliver them cleanly.',
    claims: [
      {
        id: 'c1',
        text: 'Demand for transition metals outruns supply.',
        status: 'mixed',
        checks: [
          { source: 'adoption', finding: 'Copper demand from grids, EVs and data centers keeps rising, and new mines take a decade or more to open.' },
          { source: 'filings', finding: 'Salar cut lithium output after prices fell, a reminder of how fast the market can flip from shortage to glut.' },
        ],
      },
      {
        id: 'c2',
        text: 'Recycling scales up fast enough to matter.',
        status: 'supported',
        checks: [
          { source: 'filings', finding: 'Cyclon processed 40% more batteries this year and signed supply deals with two cell makers.' },
          { source: 'policy', finding: 'Some rules now reward using recycled or locally sourced battery materials.' },
        ],
      },
      {
        id: 'c3',
        text: 'Buyers pay a premium for low-carbon steel and cement.',
        status: 'weak',
        checks: [
          { source: 'adoption', finding: 'Government buyers are starting to require low-carbon materials, but private buyers rarely pay more.' },
          { source: 'filings', finding: 'Solidcore says its low-carbon cement earns a 5% premium in only two states.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'Commodity cycles',
        text: 'Metal prices swing hard. A wave of new supply can crush profits for miners like Salar and Nickelbay.',
      },
      {
        title: 'Batteries change recipes',
        text: 'Battery makers are shifting to chemistries that use less nickel and cobalt.',
      },
      {
        title: 'Green premiums are thin',
        text: 'If buyers won’t pay more, low-carbon steel and cement compete on price alone.',
      },
    ],
    basket: ['CYCL', 'SALR', 'NKLB', 'FGST', 'SLDC', 'COPR'],
    alpha: 0.01,
    watch: 'lithium and copper prices, and recycled-content rules',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c2',
        title: 'Cell maker signs a 10-year recycled-metals deal with Cyclon',
        summary: 'A long contract supports the claim that recycling scales fast enough to matter.',
        whatHappened:
          'A battery cell maker agreed to buy most of Cyclon’s recovered nickel and lithium for 10 years, giving it the steady demand it needs to build a second plant.',
        companies: ['CYCL'],
        source: 'Battery Brief',
        action: 'No action needed. This supports claim 2, your strongest claim.',
      },
      {
        kind: 'weakens',
        claimId: 'c1',
        title: 'Lithium prices slide to a four-year low',
        summary: 'A price slump tests the claim that demand outruns supply.',
        whatHappened:
          'Lithium prices fell to a four-year low as new mines came online faster than expected. Salar said it may delay an expansion.',
        companies: ['SALR'],
        source: 'Market Pulse',
        action: 'Worth a look. Ask the copilot whether to trim miners in favor of recyclers.',
      },
    ],
  },
  {
    key: 'adaptation',
    label: 'Climate adaptation',
    short: 'Adaptation',
    keywords: /adapt|heat ?waves?|air condition|\bac\b|cooling|drought|\bwater\b|wildfires?|\bfires?\b|floods?|flooding|sea ?levels?|insur(?:ance|ers?)|resilien|hurricanes?|storms?/gi,
    title: 'Paying to adapt',
    statement:
      'Cities, utilities and insurers will spend more on adapting to heat, drought, fire and floods than the market expects {horizon}, growing revenue for the companies that build and measure that resilience.',
    claims: [
      {
        id: 'c1',
        text: 'Climate damage keeps getting more expensive.',
        status: 'supported',
        checks: [
          { source: 'adoption', finding: 'Insured losses from severe weather have trended up over the past decade.' },
          { source: 'filings', finding: 'Skyline says insurer demand for its flood models grew 35% after this year’s storm season.' },
        ],
      },
      {
        id: 'c2',
        text: 'Public money pays for resilience.',
        status: 'mixed',
        checks: [
          { source: 'policy', finding: 'Resilience projects are funded by local bonds and federal grants, and federal grant programs have become less predictable.' },
          { source: 'filings', finding: 'Floodgate’s backlog is up 22%, mostly from city bond measures voters approved.' },
        ],
      },
      {
        id: 'c3',
        text: 'Water reuse and cooling become everyday infrastructure.',
        status: 'supported',
        checks: [
          { source: 'adoption', finding: 'Drought-hit cities in the West are approving water reuse projects, and peak cooling demand keeps setting records.' },
          { source: 'filings', finding: 'Purewell’s water reuse orders doubled in two years.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'Public budgets move slowly',
        text: 'Cities can take years to go from approving a project to building it.',
      },
      {
        title: 'Hard to pick winners',
        text: 'Much of the adaptation spending goes to small contractors that aren’t publicly traded.',
      },
      {
        title: 'Quiet seasons',
        text: 'A mild storm or fire season can slow orders, even if the long-term trend holds.',
      },
    ],
    basket: ['PURW', 'BLUE', 'CHLW', 'FLDG', 'EMBR', 'SKWX'],
    alpha: 0.025,
    watch: 'city bond measures for resilience, and insurer spending on risk data',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c3',
        title: 'Two Western cities approve water reuse plants',
        summary: 'New projects support the claim that water reuse becomes everyday infrastructure.',
        whatHappened:
          'Two drought-hit Western cities approved plants that turn treated wastewater back into drinking water, with construction starting next year.',
        companies: ['PURW', 'BLUE'],
        source: 'Water Desk',
        action: 'No action needed. This supports claim 3, your strongest claim.',
      },
      {
        kind: 'weakens',
        claimId: 'c2',
        title: 'A federal resilience grant program faces cuts',
        summary: 'Less federal money tests the claim that public money pays for resilience.',
        whatHappened:
          'A proposed budget would cut a federal grant program that helps cities pay for flood protection, putting some planned projects on hold.',
        companies: ['FLDG'],
        source: 'Civic Ledger',
        action: 'Worth a look. Ask the copilot how much of your basket depends on federal grants.',
      },
    ],
  },
  {
    // Kept last: words like "AI" or "utility" are generic, so more specific topics win ties.
    key: 'grid',
    label: 'Grid & power demand',
    short: 'Grid',
    keywords: /\bgrids?\b|transmission|transformers?|power lines?|utilit(?:y|ies)|data ?cent(?:er|re)s?|\bai\b|electricity demand|power demand|interconnection|blackouts?|substations?|switchgear/gi,
    title: 'The grid is the bottleneck',
    statement:
      'Power demand from data centers, EVs and electrified buildings will outgrow the grid faster than the market expects {horizon}, making transformers, transmission and grid software the bottleneck everyone pays for.',
    claims: [
      {
        id: 'c1',
        text: 'Electricity demand grows faster than planned.',
        status: 'supported',
        checks: [
          { source: 'adoption', finding: 'After years of flat demand, U.S. utilities have raised their load forecasts, led by data centers.' },
          { source: 'filings', finding: 'Cascade Power & Light raised its five-year demand forecast for the third year in a row.' },
        ],
      },
      {
        id: 'c2',
        text: 'Grid equipment stays in short supply.',
        status: 'supported',
        checks: [
          { source: 'filings', finding: 'Transforma’s transformer backlog stretches past two years, and it raised prices twice this year.' },
          { source: 'adoption', finding: 'Wait times for large transformers are far longer than they were a few years ago.' },
        ],
      },
      {
        id: 'c3',
        text: 'Regulators approve the spending.',
        status: 'mixed',
        checks: [
          { source: 'policy', finding: 'Regulators have approved big grid investment plans, but rising power bills make new rate increases harder.' },
          { source: 'adoption', finding: 'New long-distance transmission lines still take many years to permit.' },
        ],
      },
    ],
    counterarguments: [
      {
        title: 'AI demand could be overestimated',
        text: 'If data centers get more efficient or AI spending cools, the demand forecasts behind this thesis could fall.',
      },
      {
        title: 'Supply catches up',
        text: 'Equipment makers are adding factories. Once shortages ease, prices and margins could drop.',
      },
      {
        title: 'Pushback on power bills',
        text: 'Customers and regulators may resist paying for grid upgrades, slowing utility spending.',
      },
    ],
    basket: ['TRFM', 'HILN', 'CSPL', 'GRDS', 'COPR', 'STOR', 'WATT'],
    alpha: 0.06,
    watch: 'utility load forecasts, and transformer lead times',
    news: [
      {
        kind: 'strengthens',
        claimId: 'c3',
        title: 'Regulators approve a $9B grid plan for Cascade Power & Light',
        summary: 'An approved spending plan supports the claim that regulators will pay for the grid.',
        whatHappened:
          'State regulators approved Cascade Power & Light’s $9B plan for new substations and transmission lines over five years, most of it to serve data centers.',
        companies: ['CSPL', 'HILN', 'TRFM'],
        source: 'Power Desk',
        action: 'No action needed. This supports claim 3, which the copilot marked as mixed.',
      },
      {
        kind: 'weakens',
        claimId: 'c1',
        title: 'A cloud giant pauses two data center projects',
        summary: 'Paused projects test the claim that power demand grows faster than planned.',
        whatHappened:
          'A large cloud company paused two planned data center campuses, saying it can get more out of the computers it already has. Utilities in both regions may lower their forecasts.',
        companies: ['GRDS', 'TRFM'],
        source: 'Market Pulse',
        action: 'Worth a look. Ask the copilot how much of your basket depends on data-center demand.',
      },
    ],
  },
]

// Used when the idea sounds like climate but doesn't name a specific technology.
export const TRANSITION = {
  key: 'transition',
  label: 'Energy transition',
  short: 'Energy transition',
  title: 'The energy transition, faster',
  statement:
    'The shift to clean energy will move faster than the market expects {horizon}, rewarding the companies most exposed to clean power, electric transport and buildings, and the grid that ties them together.',
  notice:
    'Your take is broad, so the copilot built a diversified energy transition basket. Name the shift you think the market is missing, like which technology wins and why, to get a sharper thesis.',
  claims: [
    {
      id: 'c1',
      text: 'Clean energy keeps getting cheaper than fossil fuels.',
      status: 'supported',
      checks: [
        { source: 'adoption', finding: 'Solar, wind and batteries are now among the cheapest sources of new power in most regions.' },
        { source: 'filings', finding: 'Solara and Westwind both signed new contracts below the cost of new gas plants.' },
      ],
    },
    {
      id: 'c2',
      text: 'Electrification spreads across cars, homes and industry.',
      status: 'mixed',
      checks: [
        { source: 'adoption', finding: 'EVs, heat pumps and electric industrial equipment are all growing, but at very different speeds.' },
        { source: 'filings', finding: 'Voltway and Thermiq both grew sales last year, but Voltway’s growth slowed sharply.' },
      ],
    },
    {
      id: 'c3',
      text: 'Policy support holds up.',
      status: 'mixed',
      checks: [
        { source: 'policy', finding: 'Support for clean energy varies by country and changes with elections.' },
        { source: 'adoption', finding: 'Private investment in clean energy keeps rising, even where policy support is weaker.' },
      ],
    },
  ],
  counterarguments: [
    {
      title: 'Too broad to beat the market',
      text: 'A broad basket behaves a lot like a clean energy index fund. A sharper take on one specific shift is easier to test.',
    },
    {
      title: 'Interest rates hit clean energy hardest',
      text: 'Clean energy projects are mostly upfront cost, so high interest rates hurt them more than fossil fuel projects.',
    },
    {
      title: 'Policy whiplash',
      text: 'Subsidies, tariffs and rules can change quickly, and they move many of these companies at once.',
    },
  ],
  basket: ['SOLR', 'VOLT', 'TRFM', 'AMPX', 'THRM', 'GALE', 'URNX'],
  watch: 'clean energy’s share of new power plants, and EV and heat pump sales',
  news: [],
}

// The idea mentions climate at all, even if no specific topic matched.
export const CLIMATE_HINT =
  /climate|clean ?energy|renewabl|\bgreen\b|carbon|emissions?|net[- ]?zero|decarboni|energy transition|sustainab|fossil|\boil\b|natural gas|\bcoal\b|electric|energy|warming|\bco2\b|pollut|environment/i

// Skeptical takes. Baskets only buy shares, so the copilot builds the investable side and says so.
export const BEARISH_HINT = /overhyped|over-hyped|\bbubble\b|\bscam\b|\bdoomed\b|\bis dead\b|are dead|\bfad\b|will fail|won'?t work|slower than (?:expected|people think|wall street|the market|analysts)/i

export const BEARISH_NOTICE =
  'Sounds like you might be skeptical of this shift. Outvest baskets can only buy shares, so the copilot built the side you can invest in: the companies that win if it happens. Your doubts belong in the arguments against, or reword your take around who wins instead.'

export const OFF_THEME_SUGGESTIONS = [
  'Heat pumps will replace gas furnaces faster than Wall Street expects',
  'AI data centers will make grid equipment the next bottleneck',
  'Water reuse will go mainstream in the drought-hit West',
]
