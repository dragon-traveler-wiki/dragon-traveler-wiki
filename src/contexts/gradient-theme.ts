import { createContext } from 'react';

export type GradientPalette =
  | 'violet'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'ember'
  | 'dusk'
  | 'frost'
  | 'blossom'
  | 'custom';

export interface GradientPaletteAccents {
  primary:
    'violet' | 'teal' | 'orange' | 'green' | 'red' | 'blue' | 'pink' | 'yellow';
  secondary:
    | 'grape'
    | 'cyan'
    | 'pink'
    | 'lime'
    | 'teal'
    | 'orange'
    | 'blue'
    | 'violet'
    | 'yellow';
  tertiary:
    | 'pink'
    | 'orange'
    | 'yellow'
    | 'teal'
    | 'lime'
    | 'cyan'
    | 'grape'
    | 'violet'
    | 'indigo';
}

export type CustomMantineAccent = GradientPaletteAccents['primary'];

export interface CustomGradientColors {
  colorA: string;
  colorB: string;
  mantineAccent: CustomMantineAccent;
}

export const DEFAULT_CUSTOM_COLORS: CustomGradientColors = {
  colorA: '#7c3aed',
  colorB: '#9333ea',
  mantineAccent: 'violet',
};

export const GRADIENT_PALETTE_ACCENTS: Record<
  Exclude<GradientPalette, 'custom'>,
  GradientPaletteAccents
> = {
  // Arcane — rich violet, deep grape, indigo
  violet: {
    primary: 'violet',
    secondary: 'grape',
    tertiary: 'pink',
  },
  // Abyss — deep navy, electric blue, cyan
  ocean: {
    primary: 'blue',
    secondary: 'cyan',
    tertiary: 'teal',
  },
  // Golden Hour — amber, warm orange, desert gold
  sunset: {
    primary: 'orange',
    secondary: 'yellow',
    tertiary: 'orange',
  },
  // Ancient Grove — deep emerald, dark teal
  forest: {
    primary: 'green',
    secondary: 'teal',
    tertiary: 'lime',
  },
  // Dragon Fire — crimson, scarlet rose, magenta
  ember: {
    primary: 'red',
    secondary: 'pink',
    tertiary: 'grape',
  },
  // Northern Lights — electric teal, aurora violet, indigo
  dusk: {
    primary: 'teal',
    secondary: 'violet',
    tertiary: 'indigo',
  },
  // Glacial — pale sky, crystal blue, arctic shimmer
  frost: {
    primary: 'blue',
    secondary: 'cyan',
    tertiary: 'teal',
  },
  // Night Garden — deep plum, vivid rose, rich magenta
  blossom: {
    primary: 'pink',
    secondary: 'grape',
    tertiary: 'violet',
  },
};

export interface GradientThemeContextValue {
  palette: GradientPalette;
  setPalette: (palette: GradientPalette) => void;
  customColors: CustomGradientColors;
  setCustomColors: (colors: CustomGradientColors) => void;
}

export const DEFAULT_PALETTE: GradientPalette = 'violet';

export function normalizePalette(value: unknown): GradientPalette {
  if (value === 'ocean') return 'ocean';
  if (value === 'sunset') return 'sunset';
  if (value === 'forest') return 'forest';
  if (value === 'ember') return 'ember';
  if (value === 'dusk') return 'dusk';
  if (value === 'frost') return 'frost';
  if (value === 'blossom') return 'blossom';
  if (value === 'custom') return 'custom';
  return DEFAULT_PALETTE;
}

export const GradientThemeContext = createContext<GradientThemeContextValue>({
  palette: DEFAULT_PALETTE,
  setPalette: () => {
    /* noop */
  },
  customColors: DEFAULT_CUSTOM_COLORS,
  setCustomColors: () => {
    /* noop */
  },
});
