// The app's data provider. Swap this one line to move from seeded data to a live source.
import type { DataProvider } from './provider'
import { SeededProvider } from './seeded'

export type { DataProvider } from './provider'

export const provider: DataProvider = new SeededProvider()
