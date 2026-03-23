import { cn } from '@/lib/cn';

type BadgeVariant = 'cyan' | 'red' | 'green' | 'amber' | 'purple' | 'blue' | 'gray';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  red: 'bg-red-500/15 text-red-400 border-red-500/25',
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  gray: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

export function Badge({ variant = 'cyan', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
