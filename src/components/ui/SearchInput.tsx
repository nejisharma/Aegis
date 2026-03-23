'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-4 py-2 rounded-lg',
          'bg-[#0d1528] border border-[#1a2744]',
          'text-sm text-slate-200 placeholder:text-slate-500',
          'focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20',
          'transition-all duration-200'
        )}
      />
    </div>
  );
}
