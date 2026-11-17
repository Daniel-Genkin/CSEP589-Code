// The values categories. Categories are data: the seven featured ones are listed here, and one
// more per Yahoo Finance sector is derived from the securities at load time (see SeededProvider).
import type { Category } from '@/types'

export const FEATURED_CATEGORIES: Category[] = [
  { id: 'defense', label: 'Defense and weapons', featured: true, basis: 'SIPRI top arms makers', color: 'var(--flare)' },
  { id: 'fossil_fuels', label: 'Fossil fuels', featured: true, basis: 'Standard industry labels', color: 'var(--sun)' },
  { id: 'private_prisons', label: 'Private prisons', featured: true, basis: 'Federal contracts', color: 'var(--violet)' },
  { id: 'tobacco', label: 'Tobacco', featured: true, basis: 'Standard industry labels', color: 'var(--signal)' },
  { id: 'alcohol', label: 'Alcohol', featured: true, basis: 'Standard industry labels', color: 'var(--bubblegum)' },
  { id: 'gambling', label: 'Gambling', featured: true, basis: 'Standard industry labels', color: 'var(--brand-300)' },
  { id: 'animal_testing', label: 'Animal testing', featured: true, basis: 'First cause categories list', color: 'var(--cream)' },
]

/** Sector categories share one quiet colour so the featured seven stand out. */
export const SECTOR_COLOR = 'var(--bar-muted)'
export const SECTOR_BASIS = 'Yahoo Finance sector label'

/** "Consumer Cyclical" -> "sector:consumer-cyclical" */
export const sectorCategoryId = (sector: string) => `sector:${sector.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
