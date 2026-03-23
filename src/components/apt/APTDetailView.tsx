'use client';

import { ExternalLink, Shield, Code, Target, Globe, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { GlowCard } from '@/components/ui/GlowCard';
import type { MITREGroup, MITRETechnique } from '@/types/mitre';

interface APTDetailViewProps {
  group: MITREGroup;
  techniques: MITRETechnique[];
  allGroups: MITREGroup[];
}

export function APTDetailView({ group, techniques }: APTDetailViewProps) {
  const groupTechniques = techniques.filter((t) =>
    group.techniqueIds.includes(t.id)
  );

  return (
    <div className="h-full overflow-y-auto pr-1 space-y-6 custom-scrollbar">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-slate-100">{group.name}</h2>
              <Badge variant="cyan" className="font-mono">{group.id}</Badge>
            </div>
            {group.country && (
              <p className="text-sm text-slate-400 flex items-center gap-1.5 mb-2">
                <Globe className="h-4 w-4" />
                Attributed to {group.country}
              </p>
            )}
          </div>
          <a
            href={group.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors text-xs flex-shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            MITRE ATT&CK
          </a>
        </div>

        {group.aliases.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">Also known as:</span>
            {group.aliases.slice(1).map((alias) => (
              <Badge key={alias} variant="gray">{alias}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <GlowCard glowColor="blue">
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {group.description || 'No detailed description available for this group.'}
        </p>
      </GlowCard>

      {/* Techniques Used */}
      {groupTechniques.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-cyan-400" />
            Techniques Used
            <span className="text-xs text-slate-500 font-normal">
              ({groupTechniques.length})
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {groupTechniques.map((tech) => (
              <a
                key={tech.id}
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 p-2.5 rounded-lg bg-[#0a1020] border border-[#1a2744] hover:border-cyan-500/20 transition-colors group"
              >
                <Badge variant="purple" className="text-[10px] font-mono flex-shrink-0 mt-0.5">
                  {tech.id}
                </Badge>
                <div className="min-w-0">
                  <p className="text-xs text-slate-300 group-hover:text-cyan-400 transition-colors truncate">
                    {tech.name}
                  </p>
                  {tech.platforms.length > 0 && (
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {tech.platforms.join(', ')}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Associated Software */}
      {group.softwareIds.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
            <Code className="h-4 w-4 text-amber-400" />
            Associated Software
            <span className="text-xs text-slate-500 font-normal">
              ({group.softwareIds.length})
            </span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {group.softwareIds.map((sid) => (
              <Badge key={sid} variant="amber" className="font-mono text-[11px]">
                {sid}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Target Information */}
      {group.country && (
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-red-400" />
            Attribution
          </h3>
          <GlowCard glowColor="red">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-300">Country of Origin</p>
                <p className="text-xs text-slate-500">{group.country}</p>
              </div>
            </div>
          </GlowCard>
        </div>
      )}
    </div>
  );
}
