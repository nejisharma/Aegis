'use client';

import Image from 'next/image';

interface AegisLogoProps {
  size?: number;
  className?: string;
}

/** The Aegis hexagon mark (public/aegis-logo.png). Same artwork is used for the mobile app icon and splash. */
export function AegisLogo({ size = 28, className = '' }: AegisLogoProps) {
  return (
    <Image
      src="/aegis-logo.png"
      alt="Aegis"
      width={size}
      height={size}
      priority
      className={`flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
