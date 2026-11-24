import { SeededProvider } from './seeded'

export type { DataProvider } from './provider'

// Vitest-only alias. Production never imports this module or the seed files.
export const provider = new SeededProvider(0)
