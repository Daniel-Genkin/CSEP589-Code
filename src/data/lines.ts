// Rally's lines: the nine issues from the Rally Investor Survey (question 11).
// The company-to-line tags below are SAMPLE DATA, hand-written for the V7 demo until real,
// source-checked values tags exist (see docs/PROGRESS.md › Placeholders). Prices, fund holdings
// and the back-test stay live; only which companies cross which line is sample.
import type { Alert, Category, CategoryId, ValuesTag } from '@/types'

export interface Line {
  id: CategoryId
  label: string
  /** One plain line under the name, so every line is clear on its own */
  description: string
  color: string
  /** Picked by default for someone who hasn't chosen their lines yet */
  featured: boolean
}

export const LINES: Line[] = [
  { id: 'military', label: 'Military & defense', description: 'Weapons makers and military contracts', color: 'var(--flare)', featured: true },
  { id: 'environment', label: 'Environment & climate', description: 'Pollution, emissions and environmental violations', color: 'var(--sun)', featured: true },
  { id: 'human_rights', label: 'Human rights & conflict', description: 'Ties to detention, surveillance or war zones', color: 'var(--violet)', featured: true },
  { id: 'labor', label: 'Labor practices', description: 'Safety violations, wage cases and how workers are treated', color: 'var(--signal)', featured: true },
  { id: 'privacy', label: 'Data privacy', description: 'Privacy fines and misuse of personal data', color: 'var(--bubblegum)', featured: true },
  { id: 'political', label: 'Political donations', description: 'Company PAC donations and lobbying', color: 'var(--cream)', featured: false },
  { id: 'diversity', label: 'Diversity & inclusion', description: 'Discrimination cases and fair hiring and pay', color: '#5fc8d0', featured: false },
  { id: 'taxes', label: 'Corporate taxes', description: 'Tax avoidance and use of tax havens', color: '#c8bfa6', featured: false },
  { id: 'animal', label: 'Animal welfare', description: 'Animal testing and factory farming', color: '#a3d977', featured: false },
]

export const LINE_IDS = LINES.map((l) => l.id)
export const lineById = (id: CategoryId) => LINES.find((l) => l.id === id) ?? null

export const SOURCES = {
  usaspending: { name: 'USAspending.gov', url: 'https://www.usaspending.gov/search' },
  echo: { name: 'EPA ECHO', url: 'https://echo.epa.gov' },
  osha: { name: 'OSHA', url: 'https://www.osha.gov/ords/imis/establishment.html' },
  ftc: { name: 'FTC', url: 'https://www.ftc.gov/legal-library/browse/cases-proceedings' },
  fec: { name: 'FEC', url: 'https://www.fec.gov/data/committees/' },
  eeoc: { name: 'EEOC', url: 'https://www.eeoc.gov/newsroom' },
  edgar: { name: 'SEC EDGAR', url: 'https://www.sec.gov/edgar/search/' },
  register: { name: 'Federal Register', url: 'https://www.federalregister.gov' },
} as const
type SourceKey = keyof typeof SOURCES

// ticker -> [line, strength, reason, source]
type Spec = [CategoryId, 1 | 2 | 3, string, SourceKey]
const TAGS: Record<string, Spec[]> = {
  // Military & defense
  LMT: [['military', 3, 'Holds large U.S. defense contracts.', 'usaspending'], ['political', 2, 'Runs a company PAC.', 'fec']],
  RTX: [['military', 3, 'Holds large U.S. defense contracts.', 'usaspending']],
  NOC: [['military', 3, 'Holds large U.S. defense contracts.', 'usaspending']],
  GD: [['military', 3, 'Holds large U.S. defense contracts.', 'usaspending'], ['human_rights', 1, 'IT services contracts with ICE.', 'usaspending']],
  BA: [['military', 2, 'Builds military aircraft under defense contracts.', 'usaspending'], ['political', 2, 'Runs a company PAC.', 'fec']],
  LHX: [['military', 3, 'Holds large U.S. defense contracts.', 'usaspending']],
  HII: [['military', 3, 'Builds navy ships under defense contracts.', 'usaspending']],
  LDOS: [['military', 2, 'Holds U.S. defense and intelligence contracts.', 'usaspending']],
  TXT: [['military', 2, 'Builds military aircraft and vehicles.', 'usaspending']],
  GE: [['military', 1, 'Makes engines for military aircraft.', 'usaspending']],
  HON: [['military', 1, 'Holds U.S. defense contracts.', 'usaspending']],
  // Environment & climate
  XOM: [['environment', 3, 'Explores for and produces oil and natural gas.', 'echo'], ['political', 1, 'Runs a company PAC.', 'fec']],
  CVX: [['environment', 3, 'Explores for and produces oil and natural gas.', 'echo']],
  COP: [['environment', 3, 'Explores for and produces oil and natural gas.', 'echo']],
  EOG: [['environment', 3, 'Explores for and produces oil and natural gas.', 'echo']],
  OXY: [['environment', 3, 'Explores for and produces oil and natural gas.', 'echo']],
  PSX: [['environment', 2, 'Refines oil.', 'echo']],
  MPC: [['environment', 2, 'Refines oil.', 'echo']],
  VLO: [['environment', 2, 'Refines oil.', 'echo']],
  SLB: [['environment', 2, 'Provides oilfield services.', 'echo']],
  HAL: [['environment', 2, 'Provides oilfield services.', 'echo']],
  DVN: [['environment', 3, 'Explores for and produces oil and natural gas.', 'echo']],
  FANG: [['environment', 3, 'Explores for and produces oil and natural gas.', 'echo']],
  KMI: [['environment', 2, 'Runs oil and gas pipelines.', 'echo']],
  WMB: [['environment', 2, 'Runs natural gas pipelines.', 'echo']],
  OKE: [['environment', 2, 'Runs natural gas pipelines.', 'echo']],
  BKR: [['environment', 2, 'Provides oilfield services.', 'echo']],
  SO: [['environment', 1, 'Runs coal-fired power plants.', 'echo']],
  DUK: [['environment', 1, 'Runs coal-fired power plants.', 'echo']],
  // Human rights & conflict
  PLTR: [['human_rights', 3, 'Holds contracts with ICE for case-management and data software.', 'usaspending'], ['military', 2, 'Holds contracts with the U.S. Army.', 'usaspending']],
  MSI: [['human_rights', 2, 'Sells surveillance equipment to police and governments.', 'usaspending']],
  AXON: [['human_rights', 2, 'Makes police weapons and surveillance tools.', 'usaspending']],
  // Labor practices
  AMZN: [['labor', 2, 'OSHA citations at warehouses.', 'osha'], ['privacy', 2, 'FTC settlement over voice and camera data.', 'ftc'], ['taxes', 1, 'EU tax ruling.', 'edgar']],
  TSN: [['labor', 2, 'OSHA citations at meat plants.', 'osha'], ['animal', 3, 'Runs factory farms and meat processing.', 'register']],
  WMT: [['labor', 1, 'Wage and hour cases.', 'osha']],
  DG: [['labor', 2, 'OSHA citations at stores.', 'osha']],
  UPS: [['labor', 1, 'OSHA citations at facilities.', 'osha']],
  // Data privacy
  META: [['privacy', 3, 'FTC order over user data.', 'ftc']],
  GOOGL: [['privacy', 2, 'FTC and state settlements over user data.', 'ftc'], ['taxes', 1, 'EU tax cases.', 'edgar']],
  GOOG: [['privacy', 2, 'FTC and state settlements over user data.', 'ftc'], ['taxes', 1, 'EU tax cases.', 'edgar']],
  MSFT: [['privacy', 2, 'FTC settlement over children’s data.', 'ftc'], ['taxes', 1, 'IRS tax dispute.', 'edgar']],
  EFX: [['privacy', 3, 'FTC settlement over a data breach.', 'ftc']],
  // Political donations
  T: [['political', 2, 'Runs a company PAC.', 'fec']],
  CMCSA: [['political', 2, 'Runs a company PAC.', 'fec']],
  UNH: [['political', 2, 'Runs a company PAC.', 'fec']],
  HCA: [['political', 1, 'Runs a company PAC.', 'fec']],
  // Diversity & inclusion
  TSLA: [['diversity', 2, 'State civil rights lawsuit over discrimination.', 'eeoc']],
  // Corporate taxes
  AAPL: [['taxes', 2, 'EU state aid tax case.', 'edgar']],
  NKE: [['taxes', 1, 'EU tax investigation.', 'edgar']],
  // Animal welfare
  HRL: [['animal', 2, 'Runs factory farms and meat processing.', 'register']],
  MCD: [['animal', 1, 'Buys from factory farms.', 'register']],
  LLY: [['animal', 1, 'Tests drugs on animals.', 'register']],
  PFE: [['animal', 1, 'Tests drugs on animals.', 'register']],
}

/** Sample line tags for the given tickers (each holding may cross more than one line). */
export function sampleLineTags(tickers: string[]): ValuesTag[] {
  return [...new Set(tickers.map((t) => t.toUpperCase()))].flatMap((ticker) =>
    (TAGS[ticker] ?? []).map(([category, strength, reason, source]) => ({ ticker, category, strength, reason, sourceUrl: SOURCES[source].url })),
  )
}

/** The public record a tag points to, by its URL. */
export const sourceName = (url: string) => Object.values(SOURCES).find((s) => s.url === url)?.name ?? 'Source'

export const lineCategories = (): Category[] =>
  LINES.map((l) => ({ id: l.id, label: l.label, featured: l.featured, basis: 'Sample values tags (Rally V7 demo)', color: l.color, description: l.description }))

/** Sample updates for Receipts: what a new public record on a held company would look like. */
export const SAMPLE_ALERTS: Alert[] = [
  { id: 'a1', type: 'filing', ticker: 'XOM', category: 'environment', offsetMinutes: 95, summary: 'ExxonMobil says it explores for and produces oil and natural gas.' },
  { id: 'a2', type: 'new_tag', ticker: 'LMT', category: 'military', offsetMinutes: 260, summary: 'Lockheed Martin has a new federal contract on file.' },
  { id: 'a3', type: 'new_tag', ticker: 'PLTR', category: 'human_rights', offsetMinutes: 1440, summary: 'Palantir has a new contract award posted with ICE.' },
  { id: 'a4', type: 'filing', ticker: 'META', category: 'privacy', offsetMinutes: 2880, summary: 'Meta filed its quarterly report with an update on the FTC order.' },
  { id: 'a5', type: 'new_tag', ticker: 'AMZN', category: 'labor', offsetMinutes: 4320, summary: 'OSHA posted a new inspection at an Amazon warehouse.' },
]
