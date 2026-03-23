import { create } from 'zustand';
import type { PanelId } from '../lib/constants';
import type { CVEItem } from '../types/cve';
import type { ThreatEvent } from '../types/threat-event';

export interface MapFilters {
  severities: Set<ThreatEvent['severity']>;
  types: Set<ThreatEvent['type']>;
}

interface DashboardState {
  activePanel: PanelId;
  searchQuery: string;
  selectedCVE: CVEItem | null;
  mapFilters: MapFilters;

  setActivePanel: (panel: PanelId) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCVE: (cve: CVEItem | null) => void;
  toggleSeverityFilter: (severity: ThreatEvent['severity']) => void;
  toggleTypeFilter: (type: ThreatEvent['type']) => void;
  resetMapFilters: () => void;
}

const defaultMapFilters: MapFilters = {
  severities: new Set(['low', 'medium', 'high', 'critical']),
  types: new Set(['malware', 'phishing', 'exploit', 'ddos', 'bruteforce', 'ransomware', 'apt']),
};

export const useDashboardStore = create<DashboardState>((set) => ({
  activePanel: 'overview',
  searchQuery: '',
  selectedCVE: null,
  mapFilters: {
    severities: new Set(defaultMapFilters.severities),
    types: new Set(defaultMapFilters.types),
  },

  setActivePanel: (panel) => set({ activePanel: panel }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCVE: (cve) => set({ selectedCVE: cve }),

  toggleSeverityFilter: (severity) =>
    set((state) => {
      const next = new Set(state.mapFilters.severities);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      return { mapFilters: { ...state.mapFilters, severities: next } };
    }),

  toggleTypeFilter: (type) =>
    set((state) => {
      const next = new Set(state.mapFilters.types);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return { mapFilters: { ...state.mapFilters, types: next } };
    }),

  resetMapFilters: () =>
    set({
      mapFilters: {
        severities: new Set(defaultMapFilters.severities),
        types: new Set(defaultMapFilters.types),
      },
    }),
}));
