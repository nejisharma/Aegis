import { cn } from '@/lib/cn';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({ className, count = 1 }: LoadingSkeletonProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'shimmer rounded-lg h-4',
            i === 0 && 'w-full',
            i === 1 && 'w-4/5',
            i === 2 && 'w-3/5',
            i > 2 && 'w-2/3',
            className
          )}
        />
      ))}
    </div>
  );
}
