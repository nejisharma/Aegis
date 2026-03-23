'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { GlowCard } from '@/components/ui/GlowCard';
import { cn } from '@/lib/cn';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
  suffix?: string;
  glowColor?: 'cyan' | 'red' | 'green' | 'amber' | 'purple' | 'blue';
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = '#06b6d4',
  suffix,
  glowColor = 'cyan',
}: StatCardProps) {
  return (
    <GlowCard glowColor={glowColor} className="relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Icon in top-right */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <div
            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg"
            style={{ backgroundColor: `${color}15` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
        </div>

        {/* Value */}
        <div className="pr-10 sm:pr-12">
          <motion.span
            className="text-xl sm:text-3xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {value}
            {suffix && (
              <span className="text-sm sm:text-lg font-medium text-slate-400 ml-1">
                {suffix}
              </span>
            )}
          </motion.span>
        </div>

        {/* Title and trend */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs sm:text-sm text-slate-400">{title}</span>
          {trend !== undefined && trend !== 0 && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-[10px] sm:text-xs font-medium',
                trend > 0 ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>~{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </motion.div>
    </GlowCard>
  );
}
