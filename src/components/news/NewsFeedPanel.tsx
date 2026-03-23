'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useNewsFeed } from '@/hooks/useNewsFeed';
import { NewsCard } from './NewsCard';

const SOURCE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'bleepingcomputer', label: 'BleepingComputer' },
  { id: 'krebs', label: 'Krebs' },
  { id: 'hackernews', label: 'HackerNews' },
  { id: 'securityweek', label: 'SecurityWeek' },
];

export function NewsFeedPanel() {
  const [activeSource, setActiveSource] = useState('all');

  const sourceParam = activeSource === 'all' ? undefined : activeSource;
  const { items, error, isLoading, mutate } = useNewsFeed(sourceParam);

  return (
    <div className="space-y-4">
      <Tabs
        tabs={SOURCE_TABS}
        activeTab={activeSource}
        onTabChange={setActiveSource}
      />

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#0d1528] border border-[#1a2744] rounded-xl p-4">
              <LoadingSkeleton count={4} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
          <p className="text-sm text-slate-300 mb-1">Failed to load news feed</p>
          <p className="text-xs text-slate-500 mb-4">
            {error.message || 'Could not reach the news API'}
          </p>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-slate-300">Fetching latest security news...</p>
          <p className="text-xs text-slate-500 mt-1">
            Aggregating feeds from multiple sources
          </p>
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04 } },
          }}
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <NewsCard item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
