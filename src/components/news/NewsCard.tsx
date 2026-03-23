'use client';

import { ExternalLink } from 'lucide-react';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';
import type { NewsItem } from '@/types/news';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

const sourceVariant: Record<string, 'cyan' | 'red' | 'green' | 'amber' | 'purple' | 'blue'> = {
  BleepingComputer: 'blue',
  'Krebs on Security': 'red',
  'The Hacker News': 'green',
  SecurityWeek: 'amber',
};

interface NewsCardProps {
  item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
  const cleanDescription = stripHtml(item.description);

  return (
    <GlowCard
      glowColor={sourceVariant[item.source] || 'cyan'}
      className="group hover:scale-[1.01] transition-transform duration-200 flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{item.sourceIcon}</span>
        <Badge variant={sourceVariant[item.source] || 'cyan'}>
          {item.source}
        </Badge>
        {item.category && (
          <Badge variant="gray">{item.category}</Badge>
        )}
      </div>

      <h3 className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug mb-2">
        {item.title}
      </h3>

      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed flex-1">
        {cleanDescription}
      </p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1a2744]">
        <span className="text-[11px] text-slate-500">
          {timeAgo(item.pubDate)}
        </span>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Read more
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </GlowCard>
  );
}
