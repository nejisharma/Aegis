import { darkColors } from './palettes';

/**
 * Static dark palette, kept for backward compatibility with non-React code.
 * New code (screens, components) must use `useColors()` from './ThemeProvider'
 * so the user-selected theme (Dark / Light / System) is respected.
 */
export const colors = darkColors;

export type ColorKey = keyof typeof colors;
