import { cn } from '@/lib/cn';

interface PulsingDotProps {
  color?: 'cyan' | 'red' | 'green' | 'amber';
  size?: 'sm' | 'md' | 'lg';
}

const colorMap = {
  cyan: 'bg-cyan-400 text-cyan-400',
  red: 'bg-red-400 text-red-400',
  green: 'bg-emerald-400 text-emerald-400',
  amber: 'bg-amber-400 text-amber-400',
};

const sizeMap = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2.5 w-2.5',
  lg: 'h-3.5 w-3.5',
};

export function PulsingDot({ color = 'green', size = 'md' }: PulsingDotProps) {
  return (
    <span className={cn('relative inline-flex', sizeMap[size])}>
      <span
        className={cn(
          'absolute inset-0 rounded-full opacity-75 animate-ping',
          colorMap[color]
        )}
      />
      <span
        className={cn(
          'relative inline-flex rounded-full h-full w-full',
          colorMap[color]
        )}
      />
    </span>
  );
}
