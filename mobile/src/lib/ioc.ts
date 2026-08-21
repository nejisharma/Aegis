export type IocType = 'ip' | 'domain' | 'url' | 'hash' | 'unknown';

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^(([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|(([0-9a-f]{1,4}:){1,7}:)|(([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4})|::([0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4}|::)$/i;
const HASH = /^[0-9a-f]{32}$|^[0-9a-f]{40}$|^[0-9a-f]{64}$/i;
const DOMAIN = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export function detectIocType(raw: string): IocType {
  const q = raw.trim();
  if (!q) return 'unknown';
  if (IPV4.test(q) || IPV6.test(q)) return 'ip';
  if (HASH.test(q)) return 'hash';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(q) || q.includes('/')) {
    try {
      const u = new URL(q.includes('://') ? q : `https://${q}`);
      if (u.hostname) return 'url';
    } catch {
      return 'unknown';
    }
  }
  if (DOMAIN.test(q)) return 'domain';
  return 'unknown';
}

export function hashKind(hash: string): 'md5' | 'sha1' | 'sha256' | null {
  switch (hash.trim().length) {
    case 32:
      return 'md5';
    case 40:
      return 'sha1';
    case 64:
      return 'sha256';
    default:
      return null;
  }
}
