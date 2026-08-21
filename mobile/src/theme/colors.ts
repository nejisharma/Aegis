export const colors = {
  bg: '#060a13',
  surface: '#0b1220',
  surfaceAlt: '#111a2e',
  border: '#1e293b',
  text: '#e2e8f0',
  muted: '#64748b',
  subtle: '#94a3b8',
  accent: '#22d3ee',
  accentDim: 'rgba(34,211,238,0.15)',
  low: '#3b82f6',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
  success: '#22c55e',
} as const;

export type ColorKey = keyof typeof colors;
