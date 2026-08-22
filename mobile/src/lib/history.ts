import { useCallback, useEffect, useState } from 'react';
import { getPref, setPref } from './storage';

export type HistoryMode = 'cve' | 'ioc' | 'ip' | 'exploits';
const MAX = 10;
const key = (mode: HistoryMode) => `search-history:${mode}`;

/** Pure: newest first, de-duplicated (case-insensitive), capped. */
export function pushHistory(list: string[], term: string, max = MAX): string[] {
  const t = term.trim();
  if (!t) return list;
  const rest = list.filter((x) => x.toLowerCase() !== t.toLowerCase());
  return [t, ...rest].slice(0, max);
}

export function useSearchHistory(mode: HistoryMode) {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    getPref<string[]>(key(mode), []).then((v) => {
      if (alive) setItems(v);
    });
    return () => {
      alive = false;
    };
  }, [mode]);

  const add = useCallback(
    (term: string) => {
      setItems((prev) => {
        const next = pushHistory(prev, term);
        setPref(key(mode), next);
        return next;
      });
    },
    [mode],
  );
  const remove = useCallback(
    (term: string) => {
      setItems((prev) => {
        const next = prev.filter((x) => x !== term);
        setPref(key(mode), next);
        return next;
      });
    },
    [mode],
  );
  const clear = useCallback(() => {
    setItems([]);
    setPref(key(mode), []);
  }, [mode]);

  return { items, add, remove, clear };
}
