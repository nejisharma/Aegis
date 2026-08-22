import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getRecentCves } from '../api/endpoints';
import type { CVEItem } from '../api/types';
import { summarizeCve } from '../lib/cvss';
import { loadPrefs } from '../notifications/prefs';

/** Name of the Android widget (app.json → react-native-android-widget → widgets[].name). */
export const ANDROID_WIDGET_NAME = 'CriticalCve';
/** `kind` of the iOS WidgetKit timeline (targets/widget/Widget.swift). */
export const IOS_WIDGET_KIND = 'AegisWidget';
/** App Group shared between the iOS app and the widget extension (app.json ios.entitlements). */
export const IOS_APP_GROUP = 'group.ca.neeraj.aegis';
/** Key used both in AsyncStorage (Android/app cache) and the App Group UserDefaults (iOS). */
export const WIDGET_PAYLOAD_KEY = 'widget-payload';

export const WIDGET_DAYS = 7;
export const WIDGET_MAX_ROWS = 3;
const WATCHLIST_SCAN_LIMIT = 100;
const SUMMARY_MAX_CHARS = 90;

export interface WidgetCve {
  id: string;
  score: number | null;
  summary: string;
}

export interface WidgetPayload {
  updatedAt: number;
  critical: WidgetCve[];
  watchlistHits: number;
}

export const EMPTY_PAYLOAD: WidgetPayload = { updatedAt: 0, critical: [], watchlistHits: 0 };

/** Same matching rule as app/watchlist.tsx: id substring, or whole-word match in the description. */
export function matchesTerm(item: CVEItem, term: string): boolean {
  const t = term.toLowerCase();
  if (!t) return false;
  if (item.cve.id.toLowerCase().includes(t)) return true;
  const text = item.cve.descriptions.map((d) => d.value).join(' ').toLowerCase();
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
}

export function countWatchlistHits(items: CVEItem[], terms: string[]): number {
  if (!terms.length) return 0;
  return items.filter((item) => terms.some((t) => matchesTerm(item, t))).length;
}

/** One-line summary: first sentence-ish chunk of the English description, trimmed to ~90 chars. */
export function shortSummary(description: string, max = SUMMARY_MAX_CHARS): string {
  const flat = description.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '')}…`;
}

export function toWidgetCve(item: CVEItem): WidgetCve {
  const s = summarizeCve(item);
  return { id: s.id, score: s.score, summary: shortSummary(s.description) };
}

/** Pure assembly step, separated from the network so it can be unit-tested. */
export function assemblePayload(critical: CVEItem[], recent: CVEItem[], terms: string[], now = Date.now()): WidgetPayload {
  return {
    updatedAt: now,
    critical: critical.slice(0, WIDGET_MAX_ROWS).map(toWidgetCve),
    watchlistHits: countWatchlistHits(recent, terms),
  };
}

/** "updated 3m ago" style label; `now` is injectable for tests. */
export function updatedLabel(updatedAt: number, now = Date.now()): string {
  if (!updatedAt) return 'never updated';
  const s = Math.max(0, Math.floor((now - updatedAt) / 1000));
  if (s < 60) return 'updated just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `updated ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `updated ${h}h ago`;
  return `updated ${Math.floor(h / 24)}d ago`;
}

export async function buildWidgetPayload(): Promise<WidgetPayload> {
  const prefs = await loadPrefs().catch(() => null);
  const terms = prefs?.watchlist_terms ?? [];
  const [critical, recent] = await Promise.all([
    getRecentCves(WIDGET_DAYS, 'CRITICAL', WIDGET_MAX_ROWS),
    terms.length ? getRecentCves(WIDGET_DAYS, undefined, WATCHLIST_SCAN_LIMIT) : Promise.resolve(null),
  ]);
  return assemblePayload(critical.vulnerabilities ?? [], recent?.vulnerabilities ?? [], terms);
}

function isPayload(v: unknown): v is WidgetPayload {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as WidgetPayload).updatedAt === 'number' &&
    Array.isArray((v as WidgetPayload).critical) &&
    typeof (v as WidgetPayload).watchlistHits === 'number'
  );
}

/**
 * iOS: the widget extension runs in its own process and cannot read AsyncStorage, so the payload is
 * mirrored into the App Group UserDefaults via the `ExtensionStorage` native module that ships with
 * `@bacons/apple-targets` (ios/ExtensionStorageModule.swift). Widget.swift reads the same key.
 * Loaded lazily: the module touches the `expo` global at import time, which does not exist in Jest.
 */
function iosStorage(): { set(key: string, value: string): void } | null {
  if (Platform.OS !== 'ios') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ExtensionStorage } = require('@bacons/apple-targets') as typeof import('@bacons/apple-targets');
    return new ExtensionStorage(IOS_APP_GROUP);
  } catch {
    return null;
  }
}

export async function writeWidgetPayload(payload: WidgetPayload): Promise<void> {
  const json = JSON.stringify(payload);
  await AsyncStorage.setItem(WIDGET_PAYLOAD_KEY, json).catch(() => {});
  iosStorage()?.set(WIDGET_PAYLOAD_KEY, json);
}

export async function readWidgetPayload(): Promise<WidgetPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_PAYLOAD_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
