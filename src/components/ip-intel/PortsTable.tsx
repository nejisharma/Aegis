'use client';

import { Wifi, Server } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlowCard } from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/Badge';

interface PortsTableProps {
  ports: number[];
  hostnames: string[];
}

const SERVICE_MAP: Record<number, string> = {
  20: 'FTP Data',
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  111: 'RPC',
  135: 'MSRPC',
  139: 'NetBIOS',
  143: 'IMAP',
  161: 'SNMP',
  389: 'LDAP',
  443: 'HTTPS',
  445: 'SMB',
  465: 'SMTPS',
  514: 'Syslog',
  587: 'SMTP Sub',
  636: 'LDAPS',
  993: 'IMAPS',
  995: 'POP3S',
  1433: 'MSSQL',
  1434: 'MSSQL Browser',
  1521: 'Oracle',
  2049: 'NFS',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  5900: 'VNC',
  5985: 'WinRM',
  6379: 'Redis',
  8080: 'HTTP Alt',
  8443: 'HTTPS Alt',
  8888: 'HTTP Alt',
  9200: 'Elasticsearch',
  9300: 'Elasticsearch',
  27017: 'MongoDB',
};

const DANGEROUS_PORTS = new Set([23, 135, 139, 445, 1433, 1434, 3389, 5900, 5985, 6379, 27017]);

export function PortsTable({ ports, hostnames }: PortsTableProps) {
  const sortedPorts = [...ports].sort((a, b) => a - b);

  return (
    <GlowCard glowColor="cyan" className="space-y-3">
      <div className="flex items-center gap-2">
        <Wifi className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-200">
          Open Ports
        </h3>
        <Badge variant="cyan">{ports.length}</Badge>
      </div>

      {/* Hostnames */}
      {hostnames.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Server className="h-3 w-3 text-slate-500" />
          {hostnames.map((hostname) => (
            <Badge key={hostname} variant="blue">
              {hostname}
            </Badge>
          ))}
        </div>
      )}

      {/* Ports table */}
      {sortedPorts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a2744]">
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Port</th>
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Service</th>
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {sortedPorts.map((port, idx) => {
                const isDangerous = DANGEROUS_PORTS.has(port);
                const service = SERVICE_MAP[port] || 'Unknown';
                return (
                  <tr
                    key={port}
                    className={cn(
                      'border-b border-[#1a2744]/50 transition-colors',
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]',
                      isDangerous && 'bg-red-500/[0.03]'
                    )}
                  >
                    <td className="py-1.5 px-3">
                      <span
                        className={cn(
                          'font-mono',
                          isDangerous ? 'text-red-400' : 'text-slate-300'
                        )}
                      >
                        {port}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-400">{service}</td>
                    <td className="py-1.5 px-3">
                      {isDangerous ? (
                        <Badge variant="red">High Risk</Badge>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-slate-500 py-4 text-center">No open ports detected</p>
      )}
    </GlowCard>
  );
}
