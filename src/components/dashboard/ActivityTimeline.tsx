'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { SEVERITY_COLORS } from '@/lib/constants';
import type { ThreatEvent } from '@/types/threat-event';

interface ActivityTimelineProps {
  events: ThreatEvent[];
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

const typeLabels: Record<ThreatEvent['type'], string> = {
  malware: 'Malware',
  phishing: 'Phishing',
  exploit: 'Exploit',
  ddos: 'DDoS',
  bruteforce: 'Brute Force',
  ransomware: 'Ransomware',
  apt: 'APT',
};

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  const displayed = events.slice(0, 10);

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-slate-600 via-slate-700 to-transparent" />

      <AnimatePresence mode="popLayout" initial={false}>
        {displayed.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex items-start gap-3 pb-3"
          >
            {/* Colored dot */}
            <div className="relative z-10 mt-1.5 flex-shrink-0">
              <div
                className="w-[14px] h-[14px] rounded-full border-2"
                style={{
                  borderColor: SEVERITY_COLORS[event.severity],
                  backgroundColor: `${SEVERITY_COLORS[event.severity]}30`,
                  boxShadow: `0 0 8px ${SEVERITY_COLORS[event.severity]}50`,
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                  )}
                  style={{ color: SEVERITY_COLORS[event.severity] }}
                >
                  {typeLabels[event.type]}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded uppercase font-medium"
                  style={{
                    color: SEVERITY_COLORS[event.severity],
                    backgroundColor: `${SEVERITY_COLORS[event.severity]}15`,
                  }}
                >
                  {event.severity}
                </span>
              </div>
              <p className="text-sm text-slate-300 truncate mt-0.5">
                {event.sourceCountry}
                <span className="text-slate-500 mx-1">&rarr;</span>
                {event.targetCountry}
              </p>
              <span className="text-[11px] text-slate-500">
                {formatTimeAgo(event.timestamp)}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {displayed.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-6">
          No threat events yet...
        </p>
      )}
    </div>
  );
}
