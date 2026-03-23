'use client';

import { cn } from '@/lib/cn';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 rounded-lg bg-[#0a1020] border border-[#1a2744]', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'bg-cyan-500/15 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
