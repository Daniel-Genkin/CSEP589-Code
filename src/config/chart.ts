// Line colours for charts on the dark card surface (#211f29). See docs/STYLE.md "Charts".
//
// These three were checked with a palette validator rather than by eye: they sit in the same
// lightness band (so no line looks heavier than another), stay well apart for colour-blind
// readers, and clear 3:1 against the card. Brand sun (#f7c54e) is too light for that band, so
// the what-if line uses a deeper gold from the same family.
export const SERIES_COLORS = {
  /** The portfolio as it is: flare, the colour of what crosses your lines */
  original: '#e85a2a',
  /** The what-if: gold, from the sun family ("your basket" in Figma) */
  filtered: '#b98a1e',
  /** The S&P 500: brand blue */
  benchmark: '#5a6bf6',
} as const
