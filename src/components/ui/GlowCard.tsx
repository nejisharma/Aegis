'use client';

import { cn } from '@/lib/cn';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'red' | 'green' | 'amber' | 'purple' | 'blue';
}

const glowColorMap = {
  cyan: 'hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]',
  red: 'hover:border-red-500/30 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]',
  green: 'hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]',
  amber: 'hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]',
  purple: 'hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]',
  blue: 'hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]',
};

export function GlowCard({ children, className, glowColor = 'cyan' }: GlowCardProps) {
  return (
    <div
      className={cn(
        'bg-[#0d1528] border border-[#1a2744] rounded-xl p-3 sm:p-4',
        'transition-all duration-300',
        glowColorMap[glowColor],
        className
      )}
    >
      {children}
    </div>
  );
}
