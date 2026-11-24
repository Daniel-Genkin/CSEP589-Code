import { AlpacaProvider } from './alpaca'
import type { DataProvider } from './provider'

export type { DataProvider } from './provider'

export const provider: DataProvider = new AlpacaProvider()
