'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateThreatEvent } from '@/lib/threat-simulator';
import type { ThreatEvent } from '@/types/threat-event';

const EVENT_TTL_MS = 60_000; // Events expire after 60 seconds

export function useSimulatedThreats() {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scheduleNext = useCallback(() => {
    if (!isActive) return;

    const delay = 500 + Math.random() * 1500;
    timerRef.current = setTimeout(() => {
      setEvents((prev) => {
        const newEvent = generateThreatEvent();
        return [newEvent, ...prev];
      });
      scheduleNext();
    }, delay);
  }, [isActive]);

  // Generate new events
  useEffect(() => {
    if (isActive) {
      scheduleNext();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, scheduleNext]);

  // Cleanup expired events every 5 seconds
  useEffect(() => {
    cleanupRef.current = setInterval(() => {
      const cutoff = Date.now() - EVENT_TTL_MS;
      setEvents((prev) => prev.filter((e) => e.timestamp > cutoff));
    }, 5000);
    return () => {
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const toggleActive = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  return {
    events,
    isActive,
    clearEvents,
    toggleActive,
  };
}
