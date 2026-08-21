import { useCallback, useEffect, useRef, useState } from 'react';
import { generateThreatEvent } from '../lib/threat-simulator';
import type { ThreatEvent } from '../api/types';

const EVENT_TTL_MS = 60_000;
const MAX_EVENTS = 60;

/** Same behaviour as the website: a new simulated event every 0.5–2 s, expiring after 60 s. */
export function useSimulatedThreats(initialActive = true) {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [isActive, setIsActive] = useState(initialActive);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    const scheduleNext = () => {
      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        setEvents((prev) => [generateThreatEvent(), ...prev].slice(0, MAX_EVENTS));
        scheduleNext();
      }, 500 + Math.random() * 1500);
    };
    // Seed a few so the map is not empty on first paint.
    setEvents((prev) => (prev.length ? prev : Array.from({ length: 6 }, generateThreatEvent)));
    scheduleNext();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive]);

  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now() - EVENT_TTL_MS;
      setEvents((prev) => prev.filter((e) => e.timestamp > cutoff));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);
  const toggleActive = useCallback(() => setIsActive((p) => !p), []);

  return { events, isActive, clearEvents, toggleActive };
}
