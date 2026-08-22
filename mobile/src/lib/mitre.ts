import type { MITREData, MITREGroup, MITRETactic, MITRETechnique } from '../api/types';
import { colors } from '../theme/colors';
import type { Palette } from '../theme/palettes';

/** Same matching rule as the web MitreMatrixPanel: refs may hold the tactic id or its shortName. */
export function techniqueBelongsToTactic(technique: MITRETechnique, tactic: MITRETactic): boolean {
  return (
    technique.tacticRefs.includes(tactic.id) ||
    technique.tacticRefs.includes(tactic.shortName) ||
    technique.tacticRefs.includes(tactic.stixId)
  );
}

/** Top-level (non sub-) techniques that belong to a tactic. */
export function techniquesForTactic(techniques: MITRETechnique[], tactic: MITRETactic, includeSub = false): MITRETechnique[] {
  return techniques.filter((t) => (includeSub || !t.isSubtechnique) && techniqueBelongsToTactic(t, tactic));
}

export function tacticsForTechnique(tactics: MITRETactic[], technique: MITRETechnique): MITRETactic[] {
  return tactics.filter((tac) => techniqueBelongsToTactic(technique, tac));
}

export function subtechniquesOf(techniques: MITRETechnique[], parent: MITRETechnique): MITRETechnique[] {
  return techniques.filter((t) => t.isSubtechnique && (t.parentId === parent.id || t.id.startsWith(`${parent.id}.`)));
}

export function groupsUsingTechnique(groups: MITREGroup[], techniqueId: string): MITREGroup[] {
  return groups.filter((g) => g.techniqueIds.includes(techniqueId));
}

/** Map technique id -> number of groups using it. */
export function groupUsageCounts(groups: MITREGroup[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const g of groups) {
    for (const tid of g.techniqueIds) counts[tid] = (counts[tid] ?? 0) + 1;
  }
  return counts;
}

/** Colour for how many APT groups use a technique. Pass the active palette from `useColors()`; defaults to dark. */
export function usageColor(groupCount: number, c: Palette = colors): string {
  if (groupCount <= 0) return c.muted;
  if (groupCount <= 2) return c.low;
  if (groupCount <= 5) return c.medium;
  if (groupCount <= 9) return c.high;
  return c.critical;
}

/** Country names as they appear in MITRE group data -> ISO 3166-1 alpha-2. Mirrors the web APTGroupCard map. */
const COUNTRY_ISO: Record<string, string> = {
  china: 'CN',
  russia: 'RU',
  iran: 'IR',
  'north korea': 'KP',
  'south korea': 'KR',
  vietnam: 'VN',
  pakistan: 'PK',
  lebanon: 'LB',
  india: 'IN',
  nigeria: 'NG',
  israel: 'IL',
  palestine: 'PS',
  turkey: 'TR',
  'united states': 'US',
  usa: 'US',
  ukraine: 'UA',
  belarus: 'BY',
  syria: 'SY',
  'united arab emirates': 'AE',
  uae: 'AE',
  brazil: 'BR',
  indonesia: 'ID',
  kazakhstan: 'KZ',
};

export function countryToIso(country: string | null | undefined): string | null {
  if (!country) return null;
  const key = country.trim().toLowerCase();
  if (/^[a-z]{2}$/.test(key)) return key.toUpperCase();
  return COUNTRY_ISO[key] ?? null;
}

export function sortGroupsByTechniques(groups: MITREGroup[]): MITREGroup[] {
  return [...groups].sort((a, b) => b.techniqueIds.length - a.techniqueIds.length);
}

export function filterGroups(groups: MITREGroup[], query: string): MITREGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      g.id.toLowerCase().includes(q) ||
      g.aliases.some((a) => a.toLowerCase().includes(q)) ||
      (g.country ?? '').toLowerCase().includes(q),
  );
}

export function techniqueById(data: MITREData, id: string): MITRETechnique | undefined {
  return data.techniques.find((t) => t.id === id);
}
