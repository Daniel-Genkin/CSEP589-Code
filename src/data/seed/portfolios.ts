// Sample portfolios. PLACEHOLDERS: the team supplies the real ones.
//
// "My sample portfolio" is meant to be modeled on a real interviewed customer, with their
// permission; until the team picks one, this is an invented mix. Weights are percentages and
// must sum to 100. Dollar values and share counts are worked out from seeded prices.

export interface SamplePortfolioSpec {
  id: 'sample' | 'connected'
  name: string
  totalUsd: number
  /** ticker -> percent of the portfolio */
  weights: Record<string, number>
}

export const SAMPLE_PORTFOLIO: SamplePortfolioSpec = {
  id: 'sample',
  name: 'My sample portfolio',
  totalUsd: 10_000,
  weights: {
    AAPL: 15,
    MSFT: 12,
    NVDA: 10,
    AMZN: 10,
    GOOGL: 8,
    XOM: 8,
    TSLA: 7,
    COST: 7,
    LMT: 6,
    DIS: 6,
    JPM: 6,
    MO: 5,
  },
}

// The account a simulated brokerage connection loads: 25 holdings, $48,000, stocks and ETFs.
export const CONNECTED_PORTFOLIO: SamplePortfolioSpec = {
  id: 'connected',
  name: 'Connected account',
  totalUsd: 48_000,
  weights: {
    VOO: 30,
    VTI: 12,
    AAPL: 6,
    MSFT: 6,
    NVDA: 5,
    AMZN: 4,
    GOOGL: 4,
    META: 3,
    TSLA: 3,
    JPM: 3,
    XOM: 2.5,
    NEE: 2.5,
    V: 2,
    UNH: 2,
    LLY: 2,
    LMT: 2,
    CVX: 1.5,
    PM: 1.5,
    DIS: 1.5,
    HD: 1.5,
    COST: 1.5,
    RTX: 1,
    STZ: 1,
    LVS: 1,
    GEO: 0.5,
  },
}
