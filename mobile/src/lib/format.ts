/** Parses ISO strings plus the `YYYY-MM-DD HH:MM:SS` (UTC) form used by abuse.ch and ransomware.live. */
export function parseDate(input: string | number | Date): Date {
  if (input instanceof Date) return input;
  if (typeof input === 'number') return new Date(input);
  const m = input.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?:\.\d+)?$/);
  if (m) return new Date(`${m[1]}T${m[2]}Z`);
  return new Date(input);
}

export function timeAgo(input: string | number | Date): string {
  const t = parseDate(input).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function shortDate(input: string | Date): string {
  const d = parseDate(input);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function flagEmoji(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return '';
  const base = 0x1f1e6;
  const cc = countryCode.toUpperCase();
  return String.fromCodePoint(base + cc.charCodeAt(0) - 65, base + cc.charCodeAt(1) - 65);
}
