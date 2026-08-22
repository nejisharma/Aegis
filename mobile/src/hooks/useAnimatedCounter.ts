import { useEffect, useRef, useState } from 'react';

/** Same drifting counter as the website overview: small random increments every few seconds. */
export function useAnimatedCounter(baseValue: number, minInterval = 3000, maxInterval = 8000): number {
  const [value, setValue] = useState(baseValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      const delay = minInterval + Math.random() * (maxInterval - minInterval);
      timer.current = setTimeout(() => {
        if (cancelled) return;
        setValue((prev) => {
          const direction = Math.random() > 0.15 ? 1 : -1;
          const magnitude = Math.floor(Math.random() * 5) + 1;
          return prev + direction * magnitude;
        });
        tick();
      }, delay);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [minInterval, maxInterval]);

  return value;
}
