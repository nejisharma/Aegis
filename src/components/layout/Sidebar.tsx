'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ExternalLink,
  Wrench,
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

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const activePanel = useDashboardStore((s) => s.activePanel);
  const setActivePanel = useDashboardStore((s) => s.setActivePanel);

  const handlePanelClick = (panelId: PanelId) => {
    setActivePanel(panelId);
    onMobileClose?.();
  };

  const sidebarContent = (isOverlay: boolean) => (
    <>
      <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
        {PANEL_CONFIG.map((panel) => {
          const Icon = iconMap[panel.icon];
          const isActive = activePanel === panel.id;
          const showLabel = isOverlay || expanded;

          return (
            <button
              key={panel.id}
              onClick={() => handlePanelClick(panel.id as PanelId)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent'
              )}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]')} />
              <motion.span
                animate={{ opacity: showLabel ? 1 : 0 }}
                transition={{ duration: 0.15, delay: showLabel ? 0.05 : 0 }}
                className="overflow-hidden"
              >
                {panel.label}
              </motion.span>
            </button>
          );
        })}
      </nav>

      <a
        href="https://sectools.io/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 mx-2 mb-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent transition-all duration-200 whitespace-nowrap"
      >
        <Wrench className="h-5 w-5 flex-shrink-0" />
        <motion.span
          animate={{ opacity: (isOverlay || expanded) ? 1 : 0 }}
          transition={{ duration: 0.15, delay: (isOverlay || expanded) ? 0.05 : 0 }}
          className="overflow-hidden flex items-center gap-1.5"
        >
          Security Tools
          <ExternalLink className="h-3 w-3 opacity-50" />
        </motion.span>
      </a>

      <div className="px-3 pb-1 flex items-center gap-2">
        <AegisLogo size={22} />
        <motion.span
          animate={{ opacity: (isOverlay || expanded) ? 1 : 0 }}
          transition={{ duration: 0.15, delay: (isOverlay || expanded) ? 0.05 : 0 }}
          className="text-xs font-bold tracking-widest gradient-text whitespace-nowrap"
        >
          AEGIS
        </motion.span>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        animate={{ width: expanded ? 220 : 64 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden md:flex h-full bg-[#080e1c] border-r border-[#1a2744] flex-col py-3 overflow-hidden flex-shrink-0"
      >
        {sidebarContent(false)}
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/60 z-[1100]"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-[#080e1c] border-r border-[#1a2744] flex flex-col py-3 z-[1200]"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
