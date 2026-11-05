// Fictional public companies the mock copilot builds baskets from. All names, tickers and figures are invented.
// exposure: { topicKey: [share of the business tied to that topic (0-1), plain-English reason it fits] }
// size drives how volatile the synthetic price history is (see ../market.js).

export const COMPANIES = [
  // Building electrification
  {
    symbol: 'THRM',
    name: 'Thermiq Systems',
    sector: 'HVAC equipment',
    size: 'large',
    color: '#354BF4',
    blurb: 'Makes heat pumps and air handlers sold through 9,000 heating contractors.',
    exposure: {
      'heat-pumps': [0.62, 'Heat pumps are 62% of revenue, up from 31% three years ago, while its furnace line shrinks.'],
      adaptation: [0.12, 'Its heat pumps double as air conditioners, so hotter summers help too.'],
    },
  },
  {
    symbol: 'AIRW',
    name: 'Airwell Climate',
    sector: 'Ductless heat pumps',
    size: 'mid',
    color: '#E85A2A',
    blurb: 'Ductless mini-split heat pumps built for apartments and older homes.',
    exposure: {
      'heat-pumps': [0.81, 'Close to a pure play: 81% of sales are cold-climate mini-splits for homes without ducts.'],
    },
  },
  {
    symbol: 'COIL',
    name: 'Coilbridge Components',
    sector: 'Compressors & coils',
    size: 'mid',
    color: '#F07AB6',
    blurb: 'Supplies the compressors, coils and valves inside other brands’ heat pumps.',
    exposure: {
      'heat-pumps': [0.48, 'Sells compressors to most major heat pump brands, so it grows whichever brand wins.'],
      adaptation: [0.15, 'Its compressors also go into commercial cooling systems.'],
    },
  },
  {
    symbol: 'HOMR',
    name: 'HomeRev Services',
    sector: 'Home retrofits',
    size: 'small',
    color: '#3A2A9E',
    blurb: 'Installs heat pumps, insulation and solar in 22 states.',
    exposure: {
      'heat-pumps': [0.55, 'Heat pump installs are 55% of its jobs, and its backlog has grown six quarters in a row.'],
      solar: [0.15, 'Adds rooftop solar to about one in seven retrofits.'],
    },
  },
  {
    symbol: 'PANL',
    name: 'Panelcraft Electric',
    sector: 'Smart electrical panels',
    size: 'small',
    color: '#F7C54E',
    blurb: 'Smart electrical panels that let older homes run heat pumps and EV chargers.',
    exposure: {
      'heat-pumps': [0.4, 'Its panels skip a costly service upgrade, one of the biggest hidden costs of switching to a heat pump.'],
      ev: [0.25, 'Also manages home EV charging so the main breaker doesn’t trip.'],
      storage: [0.1, 'Connects home batteries for backup power.'],
    },
  },
  {
    symbol: 'HRTH',
    name: 'Hearthly Controls',
    sector: 'Smart thermostats',
    size: 'mid',
    color: '#D6472B',
    blurb: 'Smart thermostats and software that shift heating to off-peak hours.',
    exposure: {
      'heat-pumps': [0.35, 'Utilities pay it to pre-heat homes off-peak, which makes heat pumps cheaper to run.'],
      grid: [0.15, 'Its thermostat network acts like a virtual power plant for utilities.'],
    },
  },
  {
    symbol: 'WATT',
    name: 'Wattline Supply',
    sector: 'Electrical distribution',
    size: 'large',
    color: '#8A6CF2',
    blurb: 'Distributor selling wire, breakers and equipment to electricians.',
    exposure: {
      'heat-pumps': [0.18, 'Every heat pump install needs electrical work, and contractors buy the parts here.'],
      grid: [0.2, 'Supplies utilities and data-center builders with switchgear and cable.'],
      ev: [0.1, 'Sells home and workplace chargers through its contractor network.'],
    },
  },
  {
    symbol: 'COPR',
    name: 'Copperline Wire & Cable',
    sector: 'Wire & cable',
    size: 'large',
    color: '#354BF4',
    blurb: 'Makes copper wire and cable for buildings, grids and chargers.',
    exposure: {
      grid: [0.3, 'Transmission and data-center wiring are its fastest-growing lines.'],
      'heat-pumps': [0.12, 'Rewiring buildings for electrification adds steady demand.'],
      materials: [0.35, 'Owns a recycled-copper smelter, so it benefits as copper gets scarcer.'],
      wind: [0.15, 'Supplies cable for onshore wind farms.'],
    },
  },

  // EVs & charging
  {
    symbol: 'VOLT',
    name: 'Voltway Motors',
    sector: 'Electric vehicles',
    size: 'large',
    color: '#E85A2A',
    blurb: 'Designs and builds electric cars, trucks and home chargers.',
    exposure: {
      ev: [0.92, 'Only makes electric vehicles and chargers, so it rises and falls with EV demand.'],
    },
  },
  {
    symbol: 'AMPX',
    name: 'Ampera Cells',
    sector: 'Battery cells',
    size: 'mid',
    color: '#F07AB6',
    blurb: 'Makes lithium-ion battery cells in Michigan and Georgia.',
    exposure: {
      ev: [0.55, 'More than half its cells go into EVs under long-term contracts with three automakers.'],
      storage: [0.4, 'Its grid-storage cells are the fastest-growing part of the business.'],
    },
  },
  {
    symbol: 'CHRG',
    name: 'ChargeGrid Networks',
    sector: 'EV charging',
    size: 'small',
    color: '#3A2A9E',
    blurb: 'Runs 40,000 public fast chargers across North America.',
    exposure: {
      ev: [0.95, 'Earns money every time an EV plugs in, so it grows with EV miles driven.'],
    },
  },
  {
    symbol: 'MTVO',
    name: 'Motivo Drive Systems',
    sector: 'EV components',
    size: 'mid',
    color: '#F7C54E',
    blurb: 'Builds electric motors and thermal systems for automakers.',
    exposure: {
      ev: [0.6, 'Supplies motors to 11 EV models, so it wins whichever automaker sells the most.'],
    },
  },
  {
    symbol: 'SALR',
    name: 'Salar Lithium',
    sector: 'Lithium mining',
    size: 'mid',
    color: '#D6472B',
    blurb: 'Lithium brine and hard-rock mines in Nevada and Chile.',
    exposure: {
      ev: [0.4, 'Most of its lithium ends up in EV batteries.'],
      storage: [0.35, 'Grid batteries are a growing share of its demand.'],
      materials: [0.7, 'A pure lithium producer, so profits swing hard with lithium prices.'],
    },
  },
  {
    symbol: 'CHIP',
    name: 'Chipworks',
    sector: 'Semiconductors',
    size: 'large',
    color: '#8A6CF2',
    blurb: 'Designs chips for phones, cars and AI data centers.',
    exposure: {
      ev: [0.18, 'Its power chips control the motor and battery in many EVs.'],
      grid: [0.12, 'Sells grid-grade power chips, and its AI chips drive data-center power demand.'],
    },
  },
  {
    symbol: 'HAUL',
    name: 'Haulvolt Trucks',
    sector: 'Electric trucks',
    size: 'small',
    color: '#354BF4',
    blurb: 'Electric delivery trucks and school buses.',
    exposure: {
      ev: [0.85, 'Sells electric delivery trucks to fleets, where charging is simpler and savings show up fastest.'],
      hydrogen: [0.15, 'Is testing a fuel-cell truck for long-haul routes.'],
    },
  },

  // Solar
  {
    symbol: 'SOLR',
    name: 'Solara Renewables',
    sector: 'Solar developer',
    size: 'large',
    color: '#E85A2A',
    blurb: 'Builds solar farms and home batteries across the U.S. and Latin America.',
    exposure: {
      solar: [0.7, 'Owns 18 GW of solar farms and sells the power under long-term contracts.'],
      storage: [0.2, 'Pairs most new solar farms with batteries.'],
    },
  },
  {
    symbol: 'HELI',
    name: 'Helio Panels',
    sector: 'Solar panels',
    size: 'mid',
    color: '#F07AB6',
    blurb: 'Makes solar panels in Ohio and Texas.',
    exposure: {
      solar: [0.9, 'A pure-play panel maker, so it benefits most if U.S.-made panels stay in demand.'],
    },
  },
  {
    symbol: 'INVT',
    name: 'Invertek Power',
    sector: 'Power electronics',
    size: 'mid',
    color: '#3A2A9E',
    blurb: 'Microinverters and controllers for rooftop solar and batteries.',
    exposure: {
      solar: [0.75, 'Its microinverters sit behind about one in four new U.S. rooftop systems.'],
      storage: [0.2, 'Its battery controllers grow as homes add storage.'],
    },
  },
  {
    symbol: 'RAYS',
    name: 'Raystack Trackers',
    sector: 'Solar trackers',
    size: 'mid',
    color: '#F7C54E',
    blurb: 'Tracker systems that tilt utility-scale panels toward the sun.',
    exposure: {
      solar: [0.85, 'Wins on almost every big solar farm, whichever panel brand is used.'],
    },
  },
  {
    symbol: 'SNWD',
    name: 'Sunward Homes',
    sector: 'Rooftop solar',
    size: 'small',
    color: '#D6472B',
    blurb: 'Installs and leases rooftop solar to homeowners.',
    exposure: {
      solar: [0.8, 'Rooftop installs and leases are nearly all of its revenue.'],
      storage: [0.15, 'Attaches a home battery to 40% of new systems.'],
    },
  },
  {
    symbol: 'POLY',
    name: 'Polysil Materials',
    sector: 'Polysilicon',
    size: 'mid',
    color: '#8A6CF2',
    blurb: 'Makes polysilicon, the raw material inside solar cells.',
    exposure: {
      solar: [0.65, 'An upstream supplier that sells polysilicon to most U.S. panel factories.'],
      materials: [0.2, 'Also sells silicon to chipmakers.'],
    },
  },

  // Wind
  {
    symbol: 'GALE',
    name: 'Galeforce Turbines',
    sector: 'Wind turbines',
    size: 'large',
    color: '#354BF4',
    blurb: 'Builds onshore and offshore wind turbines.',
    exposure: {
      wind: [0.8, 'Turbines and service contracts make up most of its revenue.'],
    },
  },
  {
    symbol: 'WSTW',
    name: 'Westwind Power',
    sector: 'Wind developer',
    size: 'mid',
    color: '#E85A2A',
    blurb: 'Owns and operates 12 GW of wind farms across the Plains.',
    exposure: {
      wind: [0.85, 'Sells power from its wind farms under 15- to 20-year contracts.'],
      hydrogen: [0.1, 'Plans to run an electrolyzer on spare overnight wind power.'],
    },
  },
  {
    symbol: 'NSEA',
    name: 'Seaway Cable & Grid',
    sector: 'Subsea cable',
    size: 'mid',
    color: '#F07AB6',
    blurb: 'Subsea cables linking offshore wind farms to the grid.',
    exposure: {
      wind: [0.5, 'Half its backlog is cable for offshore wind farms.'],
      grid: [0.4, 'Also builds long-distance high-voltage links between regions.'],
    },
  },
  {
    symbol: 'BLDE',
    name: 'Bladeworks Composites',
    sector: 'Turbine blades',
    size: 'small',
    color: '#3A2A9E',
    blurb: 'Turbine blades and composite parts.',
    exposure: {
      wind: [0.75, 'Makes blades for three turbine brands, so its volume follows new wind builds.'],
    },
  },
  {
    symbol: 'HRBR',
    name: 'Harborline Marine',
    sector: 'Offshore installation',
    size: 'small',
    color: '#F7C54E',
    blurb: 'Ships and crews that install offshore wind turbines.',
    exposure: {
      wind: [0.7, 'Owns two of the few U.S. ships that can install offshore turbines.'],
    },
  },

  // Batteries & storage
  {
    symbol: 'STOR',
    name: 'Stackwell Storage',
    sector: 'Grid batteries',
    size: 'mid',
    color: '#D6472B',
    blurb: 'Grid-scale battery systems for utilities.',
    exposure: {
      storage: [0.9, 'Designs and installs grid batteries, with a 9 GWh backlog.'],
      grid: [0.3, 'Utilities use its batteries instead of building new peaker plants.'],
    },
  },
  {
    symbol: 'SWAV',
    name: 'Saltwave Batteries',
    sector: 'Sodium-ion batteries',
    size: 'small',
    color: '#8A6CF2',
    blurb: 'Sodium-ion batteries that skip lithium and cobalt.',
    exposure: {
      storage: [0.95, 'A pure play on sodium-ion cells for home and grid storage.'],
    },
  },
  {
    symbol: 'IRFL',
    name: 'Ironflow Energy',
    sector: 'Long-duration storage',
    size: 'small',
    color: '#354BF4',
    blurb: 'Iron-air batteries that store power for days, not hours.',
    exposure: {
      storage: [0.95, 'Its iron-air systems target multi-day storage that lithium can’t do cheaply.'],
    },
  },

  // Grid & power demand
  {
    symbol: 'TRFM',
    name: 'Transforma Electric',
    sector: 'Grid equipment',
    size: 'large',
    color: '#E85A2A',
    blurb: 'Transformers and switchgear for utilities and data centers.',
    exposure: {
      grid: [0.7, 'Its transformer backlog stretches past two years as utilities and data centers line up.'],
      nuclear: [0.1, 'Supplies switchgear for reactor upgrades.'],
    },
  },
  {
    symbol: 'HILN',
    name: 'Highline Transmission',
    sector: 'Transmission builder',
    size: 'mid',
    color: '#F07AB6',
    blurb: 'Designs and builds high-voltage power lines.',
    exposure: {
      grid: [0.85, 'Builds the long-distance lines needed to connect new power plants.'],
    },
  },
  {
    symbol: 'GRDS',
    name: 'Gridsense Software',
    sector: 'Grid software',
    size: 'small',
    color: '#3A2A9E',
    blurb: 'Software that helps utilities forecast load and balance the grid.',
    exposure: {
      grid: [0.8, 'Sells software to 140 utilities planning for data-center and EV load.'],
    },
  },
  {
    symbol: 'CSPL',
    name: 'Cascade Power & Light',
    sector: 'Utility',
    size: 'large',
    color: '#F7C54E',
    blurb: 'Regulated utility serving 4 million customers in the Northwest.',
    exposure: {
      grid: [0.6, 'Data-center demand in its territory grows 20% a year, and it earns a return on new grid spending.'],
      nuclear: [0.3, 'Runs two reactors and plans to extend their licenses.'],
      'heat-pumps': [0.08, 'Its rebate program pays customers to switch to heat pumps.'],
    },
  },

  // Nuclear
  {
    symbol: 'CRFN',
    name: 'Corefield Nuclear',
    sector: 'Small reactors',
    size: 'small',
    color: '#D6472B',
    blurb: 'Develops small modular reactors.',
    exposure: {
      nuclear: [0.95, 'Developing small modular reactors, with its first plant under construction.'],
    },
  },
  {
    symbol: 'URNX',
    name: 'Uranex Fuel',
    sector: 'Uranium',
    size: 'mid',
    color: '#8A6CF2',
    blurb: 'Mines and enriches uranium for reactors.',
    exposure: {
      nuclear: [0.9, 'Uranium sales rise with every reactor restart or license extension.'],
    },
  },
  {
    symbol: 'ATNS',
    name: 'Atlas Nuclear Services',
    sector: 'Reactor services',
    size: 'mid',
    color: '#354BF4',
    blurb: 'Maintains and upgrades existing reactors.',
    exposure: {
      nuclear: [0.7, 'Earns steady service fees from 40 reactors, plus upgrade work when plants extend their lives.'],
    },
  },
  {
    symbol: 'KSTN',
    name: 'Keystone Forgings',
    sector: 'Heavy forgings',
    size: 'small',
    color: '#E85A2A',
    blurb: 'Heavy steel forgings for reactors and turbines.',
    exposure: {
      nuclear: [0.45, 'One of two North American shops that can forge reactor vessels.'],
      wind: [0.1, 'Also forges turbine shafts.'],
    },
  },

  // Hydrogen
  {
    symbol: 'HYLY',
    name: 'Hydrolyte Electrolyzers',
    sector: 'Electrolyzers',
    size: 'small',
    color: '#F07AB6',
    blurb: 'Machines that split water into green hydrogen.',
    exposure: {
      hydrogen: [0.95, 'Sells electrolyzers, so it needs green hydrogen projects to actually get built.'],
    },
  },
  {
    symbol: 'CLST',
    name: 'Cellstream Fuel Cells',
    sector: 'Fuel cells',
    size: 'small',
    color: '#3A2A9E',
    blurb: 'Fuel cells for forklifts, trucks and backup power.',
    exposure: {
      hydrogen: [0.85, 'Its fuel cells only make sense for most buyers if hydrogen gets cheap.'],
    },
  },
  {
    symbol: 'NSIG',
    name: 'Northstar Industrial Gases',
    sector: 'Industrial gases',
    size: 'large',
    color: '#F7C54E',
    blurb: 'Supplies hydrogen, oxygen and CO₂ to factories and refineries.',
    exposure: {
      hydrogen: [0.2, 'Already sells hydrogen to refineries and is building two green hydrogen plants.'],
      carbon: [0.15, 'Captures and resells CO₂ from its own plants.'],
    },
  },
  {
    symbol: 'GPAM',
    name: 'Greenport Ammonia',
    sector: 'Green ammonia',
    size: 'small',
    color: '#D6472B',
    blurb: 'Turns green hydrogen into ammonia for fertilizer and shipping fuel.',
    exposure: {
      hydrogen: [0.7, 'Turns hydrogen into ammonia, which is easier to ship and store.'],
      food: [0.2, 'Sells low-carbon ammonia to fertilizer makers.'],
    },
  },

  // Carbon removal
  {
    symbol: 'SKYC',
    name: 'Skyscrub Carbon',
    sector: 'Direct air capture',
    size: 'small',
    color: '#8A6CF2',
    blurb: 'Machines that pull CO₂ straight out of the air.',
    exposure: {
      carbon: [0.95, 'Sells carbon-removal credits from its air-capture plants.'],
    },
  },
  {
    symbol: 'TVLT',
    name: 'Terravault',
    sector: 'CO₂ storage',
    size: 'mid',
    color: '#354BF4',
    blurb: 'Pipelines and wells that store captured CO₂ underground.',
    exposure: {
      carbon: [0.6, 'Gets paid per ton to move and store CO₂ from capture projects.'],
    },
  },
  {
    symbol: 'CHAR',
    name: 'Charwell Biocarbon',
    sector: 'Biochar',
    size: 'small',
    color: '#E85A2A',
    blurb: 'Turns farm and forest waste into biochar that locks away carbon.',
    exposure: {
      carbon: [0.85, 'Sells removal credits, plus biochar as a soil additive.'],
      food: [0.1, 'Farmers use its biochar to improve their soil.'],
    },
  },
  {
    symbol: 'BSLT',
    name: 'Basalt Earthworks',
    sector: 'Rock weathering',
    size: 'small',
    color: '#F07AB6',
    blurb: 'Spreads crushed rock on farmland to absorb CO₂.',
    exposure: {
      carbon: [0.8, 'Sells removal credits from spreading crushed basalt on farms.'],
    },
  },
  {
    symbol: 'LDGR',
    name: 'Ledgerleaf',
    sector: 'Carbon markets',
    size: 'small',
    color: '#3A2A9E',
    blurb: 'Runs a registry and marketplace for carbon credits.',
    exposure: {
      carbon: [0.75, 'Takes a fee on every credit traded, so it grows with the whole market.'],
    },
  },

  // Food & farming
  {
    symbol: 'GRNB',
    name: 'Greenbloom Foods',
    sector: 'Plant-based food',
    size: 'mid',
    color: '#F7C54E',
    blurb: 'Makes plant-based milks, snacks and frozen meals sold in 30 countries.',
    exposure: {
      food: [0.9, 'Fully plant-based, with products at about a third of the emissions of dairy.'],
    },
  },
  {
    symbol: 'CLTV',
    name: 'Cultiva Proteins',
    sector: 'Fermented proteins',
    size: 'small',
    color: '#D6472B',
    blurb: 'Brews dairy and egg proteins with fermentation instead of animals.',
    exposure: {
      food: [0.95, 'Sells fermentation-made whey and egg protein to big food brands.'],
    },
  },
  {
    symbol: 'FLDS',
    name: 'Fieldsense',
    sector: 'Farm tech',
    size: 'small',
    color: '#8A6CF2',
    blurb: 'Sensors and software that help farms use less fertilizer and water.',
    exposure: {
      food: [0.85, 'Farms pay per acre for software that cuts fertilizer use about 15%.'],
      adaptation: [0.15, 'Its irrigation tools help farms get through droughts.'],
    },
  },
  {
    symbol: 'VRDF',
    name: 'Verdant Fertilizer',
    sector: 'Fertilizer',
    size: 'mid',
    color: '#354BF4',
    blurb: 'Fertilizer made with low-carbon ammonia.',
    exposure: {
      food: [0.6, 'Low-carbon fertilizer is its growth line, sold at a premium to food brands with climate targets.'],
      hydrogen: [0.3, 'Buys green hydrogen to make its ammonia.'],
    },
  },
  {
    symbol: 'RSTK',
    name: 'Rootstock Land',
    sector: 'Farmland',
    size: 'mid',
    color: '#E85A2A',
    blurb: 'Owns 900,000 acres of farmland moving to regenerative practices.',
    exposure: {
      food: [0.7, 'Earns rent plus a premium on crops grown with regenerative practices.'],
      carbon: [0.1, 'Sells soil-carbon credits from its land.'],
    },
  },
  {
    symbol: 'FRST',
    name: 'Frostline Logistics',
    sector: 'Cold storage',
    size: 'mid',
    color: '#F07AB6',
    blurb: 'Efficient cold storage that cuts food waste.',
    exposure: {
      food: [0.5, 'Its cold chain cuts spoilage, and grocers pay for that.'],
      adaptation: [0.15, 'Heat waves make reliable cold storage more valuable.'],
    },
  },

  // Critical minerals & materials
  {
    symbol: 'CYCL',
    name: 'Cyclon Recycling',
    sector: 'Battery recycling',
    size: 'small',
    color: '#3A2A9E',
    blurb: 'Recovers lithium, nickel and cobalt from old batteries.',
    exposure: {
      materials: [0.9, 'Gets paid to take old batteries, then sells the metals back to cell makers.'],
      storage: [0.2, 'Recycles retired grid batteries too.'],
      ev: [0.15, 'Most of its feedstock is scrap from EV battery factories.'],
    },
  },
  {
    symbol: 'FGST',
    name: 'Forgegreen Steel',
    sector: 'Steel',
    size: 'large',
    color: '#F7C54E',
    blurb: 'Steel made in electric furnaces from recycled scrap.',
    exposure: {
      materials: [0.7, 'Its electric-furnace steel has about a quarter of the emissions of blast-furnace steel.'],
      hydrogen: [0.1, 'Is piloting iron made with hydrogen.'],
    },
  },
  {
    symbol: 'SLDC',
    name: 'Solidcore Cement',
    sector: 'Cement',
    size: 'mid',
    color: '#D6472B',
    blurb: 'Low-carbon cement and concrete.',
    exposure: {
      materials: [0.8, 'Its blended cement cuts emissions about 40%, and public buyers are starting to require it.'],
    },
  },
  {
    symbol: 'NKLB',
    name: 'Nickelbay Mining',
    sector: 'Nickel mining',
    size: 'mid',
    color: '#8A6CF2',
    blurb: 'Nickel and cobalt mines in Canada.',
    exposure: {
      materials: [0.8, 'One of few North American nickel sources, which helps automakers meet local-content rules.'],
      ev: [0.2, 'Most of its nickel goes into EV batteries.'],
    },
  },

  // Climate adaptation
  {
    symbol: 'BLUE',
    name: 'Bluewater Utilities',
    sector: 'Water utility',
    size: 'large',
    color: '#354BF4',
    blurb: 'Provides drinking water to 12 million people across 9 states.',
    exposure: {
      adaptation: [0.55, 'Regulators let it earn a return on drought and flood upgrades.'],
    },
  },
  {
    symbol: 'PURW',
    name: 'Purewell Water',
    sector: 'Water tech',
    size: 'mid',
    color: '#E85A2A',
    blurb: 'Water reuse, desalination and leak detection.',
    exposure: {
      adaptation: [0.75, 'Sells water reuse systems to cities facing drought.'],
    },
  },
  {
    symbol: 'CHLW',
    name: 'Chillwell Cooling',
    sector: 'Cooling systems',
    size: 'large',
    color: '#F07AB6',
    blurb: 'Air conditioners and commercial cooling systems.',
    exposure: {
      adaptation: [0.6, 'Hotter summers lift demand for its air conditioning and data-center cooling.'],
      'heat-pumps': [0.25, 'Its newer units run as heat pumps in winter, about a quarter of sales.'],
    },
  },
  {
    symbol: 'FLDG',
    name: 'Floodgate Infrastructure',
    sector: 'Flood protection',
    size: 'small',
    color: '#3A2A9E',
    blurb: 'Flood barriers, stormwater systems and sea walls.',
    exposure: {
      adaptation: [0.9, 'Cities and ports are its main customers, paid for by resilience budgets.'],
    },
  },
  {
    symbol: 'EMBR',
    name: 'Emberguard',
    sector: 'Wildfire safety',
    size: 'small',
    color: '#F7C54E',
    blurb: 'Wildfire detection cameras and fire-resistant building materials.',
    exposure: {
      adaptation: [0.85, 'Utilities and insurers buy its cameras to spot fires early.'],
    },
  },
  {
    symbol: 'SKWX',
    name: 'Skyline Risk Analytics',
    sector: 'Climate risk data',
    size: 'small',
    color: '#D6472B',
    blurb: 'Climate-risk data for insurers, lenders and cities.',
    exposure: {
      adaptation: [0.8, 'Insurers subscribe to its flood and fire risk models.'],
    },
  },
]
