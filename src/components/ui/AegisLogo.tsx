'use client';

interface AegisLogoProps {
  size?: number;
  className?: string;
}

export function AegisLogo({ size = 28, className = '' }: AegisLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="aegis-grad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="aegis-core" x1="24" y1="24" x2="40" y2="40">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="aegis-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer ring */}
      <circle cx="32" cy="32" r="29" stroke="url(#aegis-grad)" strokeWidth="2" fill="none" opacity="0.8" />

      {/* Radar sweep arcs - segmented outer ring */}
      <path d="M32 5 A27 27 0 0 1 57 24" stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M57 40 A27 27 0 0 1 40 57" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M24 57 A27 27 0 0 1 7 40" stroke="#6366f1" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M7 24 A27 27 0 0 1 24 7" stroke="#8b5cf6" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />

      {/* Inner ring */}
      <circle cx="32" cy="32" r="19" stroke="url(#aegis-grad)" strokeWidth="1.2" fill="none" opacity="0.5" />

      {/* Radar grid ring */}
      <circle cx="32" cy="32" r="12" stroke="#06b6d4" strokeWidth="0.6" fill="none" opacity="0.25" strokeDasharray="3 3" />

      {/* Crosshair lines - full */}
      <line x1="32" y1="7" x2="32" y2="14" stroke="#22d3ee" strokeWidth="0.8" opacity="0.5" />
      <line x1="32" y1="50" x2="32" y2="57" stroke="#22d3ee" strokeWidth="0.8" opacity="0.5" />
      <line x1="7" y1="32" x2="14" y2="32" stroke="#22d3ee" strokeWidth="0.8" opacity="0.5" />
      <line x1="50" y1="32" x2="57" y2="32" stroke="#22d3ee" strokeWidth="0.8" opacity="0.5" />

      {/* Diagonal crosshair ticks */}
      <line x1="12" y1="12" x2="16" y2="16" stroke="#06b6d4" strokeWidth="0.6" opacity="0.3" />
      <line x1="48" y1="12" x2="52" y2="16" stroke="#06b6d4" strokeWidth="0.6" opacity="0.3" />
      <line x1="12" y1="52" x2="16" y2="48" stroke="#06b6d4" strokeWidth="0.6" opacity="0.3" />
      <line x1="48" y1="52" x2="52" y2="48" stroke="#06b6d4" strokeWidth="0.6" opacity="0.3" />

      {/* Central target - outer */}
      <circle cx="32" cy="32" r="7" stroke="url(#aegis-core)" strokeWidth="1.5" fill="none" filter="url(#aegis-glow)" />

      {/* Central target - inner */}
      <circle cx="32" cy="32" r="3.5" stroke="#22d3ee" strokeWidth="1" fill="none" />

      {/* Core dot */}
      <circle cx="32" cy="32" r="1.8" fill="#22d3ee" filter="url(#aegis-glow)" />

      {/* Threat indicator dots on outer ring */}
      <circle cx="49" cy="14" r="1.5" fill="#ef4444" opacity="0.8" />
      <circle cx="14" cy="46" r="1.2" fill="#f59e0b" opacity="0.7" />
      <circle cx="52" cy="42" r="1" fill="#22c55e" opacity="0.6" />
    </svg>
  );
}
