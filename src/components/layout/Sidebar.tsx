'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Globe,
  Search,
  Newspaper,
  Crosshair,
  Fingerprint,
  Radar,
  BarChart3,
  Bug,
  Shield,
  Scan,
  Eye,
  Flame,
  Calendar,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AegisLogo } from '@/components/ui/AegisLogo';
import { cn } from '@/lib/cn';
import { PANEL_CONFIG, type PanelId } from '@/lib/constants';
import { useDashboardStore } from '@/store/dashboard-store';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Globe,
  Search,
  Newspaper,
  Crosshair,
  Fingerprint,
  Radar,
  BarChart3,
  Bug,
  Shield,
  Scan,
  Eye,
  Flame,
  Calendar,
};

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const activePanel = useDashboardStore((s) => s.activePanel);
  const setActivePanel = useDashboardStore((s) => s.setActivePanel);

  return (
    <motion.aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      animate={{ width: expanded ? 220 : 64 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full bg-[#080e1c] border-r border-[#1a2744] flex flex-col py-3 overflow-hidden flex-shrink-0"
    >
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {PANEL_CONFIG.map((panel) => {
          const Icon = iconMap[panel.icon];
          const isActive = activePanel === panel.id;

          return (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id as PanelId)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent'
              )}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]')} />
              <motion.span
                animate={{ opacity: expanded ? 1 : 0 }}
                transition={{ duration: 0.15, delay: expanded ? 0.05 : 0 }}
                className="overflow-hidden"
              >
                {panel.label}
              </motion.span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-1 flex items-center gap-2">
        <AegisLogo size={22} />
        <motion.span
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.15, delay: expanded ? 0.05 : 0 }}
          className="text-xs font-bold tracking-widest gradient-text whitespace-nowrap"
        >
          AEGIS
        </motion.span>
      </div>
    </motion.aside>
  );
}
