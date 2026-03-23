'use client';

import { motion } from 'framer-motion';
import { X, ExternalLink, Shield, Users, Monitor, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { MITRETechnique, MITREGroup } from '@/types/mitre';

interface TechniqueDetailProps {
  technique: MITRETechnique;
  groups: MITREGroup[];
  onClose: () => void;
}

export function TechniqueDetail({ technique, groups, onClose }: TechniqueDetailProps) {
  const associatedGroups = groups.filter((g) =>
    g.techniqueIds.includes(technique.id)
  );

  // Truncate description for display
  const description = technique.description.length > 600
    ? technique.description.slice(0, 600) + '...'
    : technique.description;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0f1e] border-l border-[#1a2744] shadow-2xl z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0f1e] border-b border-[#1a2744] p-4 flex items-start justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Shield className="h-5 w-5 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-mono text-cyan-400">{technique.id}</p>
            <h3 className="text-base font-bold text-slate-100 truncate">
              {technique.name}
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors shrink-0"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Description
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </div>

        {/* Platforms */}
        {technique.platforms.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              Platforms
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {technique.platforms.map((platform) => (
                <Badge key={platform} variant="blue">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Detection */}
        {technique.detection && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Detection
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-[#080d1a] rounded-lg p-3 border border-[#1a2744]">
              {technique.detection.length > 400
                ? technique.detection.slice(0, 400) + '...'
                : technique.detection}
            </p>
          </div>
        )}

        {/* Associated Groups */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Associated APT Groups ({associatedGroups.length})
          </h4>
          {associatedGroups.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {associatedGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-[#080d1a] border border-[#1a2744] rounded-lg p-2.5 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200">{group.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{group.id}</p>
                  </div>
                  {group.country && (
                    <Badge variant="amber" className="text-[10px] shrink-0">
                      {group.country}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              No known groups associated with this technique.
            </p>
          )}
        </div>

        {/* Link to MITRE */}
        <a
          href={technique.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20 transition-colors text-sm font-medium"
        >
          <ExternalLink className="h-4 w-4" />
          View on MITRE ATT&CK
        </a>
      </div>
    </motion.div>
  );
}
