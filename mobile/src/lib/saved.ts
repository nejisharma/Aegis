import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ArticleResponse, NewsItem } from '../api/types';

export const SAVED_KEY = 'saved-articles';
export const SAVED_MAX = 100;

export interface SavedArticle {
  id: string;
  url: string;
  title: string;
  source: string;
  pubDate: string;
  savedAt: number;
  excerpt: string;
  textContent: string;
  contentHtml: string;
  byline?: string;
  siteName?: string;
  length: number;
}

/** Cap stored text so a single article cannot blow the AsyncStorage budget. */
export function trimForStorage(text: string, max = 200_000): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

// ---- module-level listeners so every mounted screen stays in sync ----
const listeners = new Set<(items: SavedArticle[]) => void>();
let cache: SavedArticle[] | null = null;

function notify(items: SavedArticle[]) {
  cache = items;
  for (const l of listeners) l(items);
}

async function read(): Promise<SavedArticle[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as SavedArticle[]) : [];
  } catch {
    return [];
  }
}

async function write(items: SavedArticle[]): Promise<void> {
  notify(items);
  try {
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(items));
  } catch {
    // ignore persistence failures; in-memory state is still updated
  }
}

/** Newest-saved first. */
export async function listSaved(): Promise<SavedArticle[]> {
  if (cache) return cache;
  const items = await read();
  cache = items;
  return items;
}

export async function savedIds(): Promise<Set<string>> {
  return new Set((await listSaved()).map((a) => a.id));
}

export async function isSaved(id: string): Promise<boolean> {
  return (await listSaved()).some((a) => a.id === id);
}

export async function getSaved(id: string): Promise<SavedArticle | undefined> {
  return (await listSaved()).find((a) => a.id === id);
}

export function toSavedArticle(item: NewsItem, article: ArticleResponse, now = Date.now()): SavedArticle {
  const textContent = trimForStorage(article.textContent);
  return {
    id: item.id,
    url: article.url || item.link,
    title: article.title || item.title,
    source: item.source,
    pubDate: item.pubDate,
    savedAt: now,
    excerpt: article.excerpt || item.description,
    textContent,
    contentHtml: trimForStorage(article.contentHtml),
    byline: article.byline ?? undefined,
    siteName: article.siteName ?? undefined,
    length: article.length || textContent.length,
  };
}

/** Save (or re-save) an article. Newest first; drops the oldest beyond SAVED_MAX. */
export async function saveArticle(item: NewsItem, article: ArticleResponse): Promise<SavedArticle> {
  const entry = toSavedArticle(item, article);
  const current = await listSaved();
  const next = [entry, ...current.filter((a) => a.id !== entry.id)].slice(0, SAVED_MAX);
  await write(next);
  return entry;
}

export async function removeSaved(id: string): Promise<void> {
  const current = await listSaved();
  await write(current.filter((a) => a.id !== id));
}

/** Test/debug helper: forget the in-memory cache so the next read hits storage. */
export function resetSavedCache(): void {
  cache = null;
}

/** Reactive view of the saved list; every mounted consumer updates when any of them saves/removes. */
export function useSaved() {
  const [items, setItems] = useState<SavedArticle[]>(cache ?? []);
  const [loaded, setLoaded] = useState(cache !== null);

  const refresh = useCallback(async () => {
    const list = await listSaved();
    setItems(list);
    setLoaded(true);
  }, []);

  useEffect(() => {
    listeners.add(setItems);
    refresh();
    return () => {
      listeners.delete(setItems);
    };
  }, [refresh]);

  const save = useCallback((item: NewsItem, article: ArticleResponse) => saveArticle(item, article), []);
  const remove = useCallback((id: string) => {
    // optimistic: drop locally right away, then persist
    setItems((prev) => prev.filter((a) => a.id !== id));
    return removeSaved(id);
  }, []);
  const has = useCallback((id: string) => items.some((a) => a.id === id), [items]);

  return { items, loaded, refresh, save, remove, has };
}
