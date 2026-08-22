import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AegisLogo } from '@/components/ui/AegisLogo';
import { API_URLS } from '@/lib/constants';
import type { NVDResponse } from '@/types/cve';

type Params = { params: Promise<{ id: string }> };

const CVE_RE = /^CVE-\d{4}-\d{4,}$/i;

async function fetchCve(id: string) {
  const res = await fetch(`${API_URLS.NVD_CVE}?cveId=${encodeURIComponent(id)}`, {
    headers: { 'User-Agent': 'AEGIS-Dashboard/1.0' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as NVDResponse;
  return data.vulnerabilities?.[0] ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id.toUpperCase()} | AEGIS`, description: `Details for ${id.toUpperCase()} on AEGIS.` };
}

/**
 * Shareable CVE page. Also the target of the mobile app's universal links
 * (https://aegis.neeraj.ca/cve/CVE-…): with the app installed the OS opens it there instead.
 */
export default async function CvePage({ params }: Params) {
  const { id: raw } = await params;
  const id = raw.toUpperCase();
  if (!CVE_RE.test(id)) notFound();
  const item = await fetchCve(id);
  const metric = item?.cve.metrics?.cvssMetricV31?.[0]?.cvssData;
  const description = item?.cve.descriptions.find((d) => d.lang === 'en')?.value ?? item?.cve.descriptions[0]?.value;
  const color =
    !metric ? '#6b7280' : metric.baseScore >= 9 ? '#ef4444' : metric.baseScore >= 7 ? '#f97316' : metric.baseScore >= 4 ? '#eab308' : '#3b82f6';

  return (
    <main className="min-h-screen bg-[#060a13] text-slate-200">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <header className="mb-8 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <AegisLogo size={32} />
            <span className="text-lg font-bold tracking-widest text-white">AEGIS</span>
          </Link>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-mono text-2xl font-bold text-cyan-300">{id}</h1>
          {metric ? (
            <span className="rounded-md border px-2 py-1 text-sm font-bold" style={{ color, borderColor: color, background: `${color}22` }}>
              {metric.baseScore.toFixed(1)} {metric.baseSeverity}
            </span>
          ) : null}
        </div>

        {item ? (
          <>
            <p className="mb-6 leading-7 text-slate-300">{description}</p>
            <dl className="mb-8 grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-[#1e293b] bg-[#0b1220] p-4 text-sm">
              <dt className="text-slate-500">Published</dt>
              <dd>{new Date(item.cve.published).toLocaleDateString()}</dd>
              <dt className="text-slate-500">Last modified</dt>
              <dd>{new Date(item.cve.lastModified).toLocaleDateString()}</dd>
              <dt className="text-slate-500">Status</dt>
              <dd>{item.cve.vulnStatus}</dd>
              {metric ? (
                <>
                  <dt className="text-slate-500">Attack vector</dt>
                  <dd>{metric.attackVector}</dd>
                  <dt className="text-slate-500">Vector</dt>
                  <dd className="break-all font-mono text-xs">{metric.vectorString}</dd>
                </>
              ) : null}
            </dl>
          </>
        ) : (
          <p className="mb-8 text-slate-400">NVD has no record for this identifier yet.</p>
        )}

        <div className="flex flex-wrap gap-3">
          <a
            href={`https://nvd.nist.gov/vuln/detail/${id}`}
            className="rounded-lg border border-cyan-400 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10"
          >
            View on NVD
          </a>
          <Link href={`/?cve=${id}`} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#060a13] hover:bg-cyan-300">
            Open in the AEGIS dashboard
          </Link>
        </div>
        <p className="mt-6 text-xs text-slate-500">Have the Aegis app installed? This link opens there automatically.</p>
      </div>
    </main>
  );
}
