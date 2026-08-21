import type { MITREGroup, MITRETactic, MITRETechnique } from '../src/api/types';
import {
  countryToIso,
  filterGroups,
  groupUsageCounts,
  groupsUsingTechnique,
  sortGroupsByTechniques,
  subtechniquesOf,
  tacticsForTechnique,
  techniquesForTactic,
  usageColor,
} from '../src/lib/mitre';
import { colors } from '../src/theme/colors';

const tactic = (id: string, shortName: string): MITRETactic => ({ id, stixId: `x-mitre-tactic--${id}`, name: shortName, description: '', shortName });
const tech = (id: string, refs: string[], extra: Partial<MITRETechnique> = {}): MITRETechnique => ({
  id,
  stixId: `attack-pattern--${id}`,
  name: id,
  description: '',
  tacticRefs: refs,
  platforms: [],
  isSubtechnique: false,
  url: '',
  ...extra,
});
const group = (id: string, techniqueIds: string[], extra: Partial<MITREGroup> = {}): MITREGroup => ({
  id,
  stixId: `intrusion-set--${id}`,
  name: id,
  description: '',
  aliases: [id],
  techniqueIds,
  softwareIds: [],
  url: '',
  ...extra,
});

const TA1 = tactic('TA0001', 'initial-access');
const TA2 = tactic('TA0002', 'execution');
const techniques = [
  tech('T1', ['initial-access']),
  tech('T2', ['TA0002']),
  tech('T2.001', ['TA0002'], { isSubtechnique: true, parentId: 'T2' }),
  tech('T3', ['x-mitre-tactic--TA0001', 'execution']),
];

describe('mitre helpers', () => {
  it('matches techniques to tactics by id, shortName or stixId', () => {
    expect(techniquesForTactic(techniques, TA1).map((t) => t.id)).toEqual(['T1', 'T3']);
    expect(techniquesForTactic(techniques, TA2).map((t) => t.id)).toEqual(['T2', 'T3']);
    expect(techniquesForTactic(techniques, TA2, true).map((t) => t.id)).toEqual(['T2', 'T2.001', 'T3']);
    expect(tacticsForTechnique([TA1, TA2], techniques[3]).map((t) => t.id)).toEqual(['TA0001', 'TA0002']);
  });

  it('finds sub-techniques by parentId or id prefix', () => {
    expect(subtechniquesOf(techniques, techniques[1]).map((t) => t.id)).toEqual(['T2.001']);
    expect(subtechniquesOf(techniques, techniques[0])).toEqual([]);
  });

  it('counts group usage', () => {
    const groups = [group('G1', ['T1', 'T2']), group('G2', ['T2']), group('G3', [])];
    expect(groupsUsingTechnique(groups, 'T2').map((g) => g.id)).toEqual(['G1', 'G2']);
    expect(groupUsageCounts(groups)).toEqual({ T1: 1, T2: 2 });
  });

  it('maps usage counts to colors', () => {
    expect(usageColor(0)).toBe(colors.muted);
    expect(usageColor(1)).toBe(colors.low);
    expect(usageColor(2)).toBe(colors.low);
    expect(usageColor(3)).toBe(colors.medium);
    expect(usageColor(5)).toBe(colors.medium);
    expect(usageColor(6)).toBe(colors.high);
    expect(usageColor(9)).toBe(colors.high);
    expect(usageColor(10)).toBe(colors.critical);
    expect(usageColor(40)).toBe(colors.critical);
  });

  it('maps country names to ISO codes', () => {
    expect(countryToIso('China')).toBe('CN');
    expect(countryToIso('north korea')).toBe('KP');
    expect(countryToIso('RU')).toBe('RU');
    expect(countryToIso('Atlantis')).toBeNull();
    expect(countryToIso(undefined)).toBeNull();
  });

  it('sorts and filters groups', () => {
    const groups = [group('A', ['T1'], { aliases: ['A', 'Fancy'], country: 'Russia' }), group('B', ['T1', 'T2', 'T3'], { country: 'China' })];
    expect(sortGroupsByTechniques(groups).map((g) => g.id)).toEqual(['B', 'A']);
    expect(filterGroups(groups, 'fancy').map((g) => g.id)).toEqual(['A']);
    expect(filterGroups(groups, 'chin').map((g) => g.id)).toEqual(['B']);
    expect(filterGroups(groups, '')).toHaveLength(2);
  });
});
