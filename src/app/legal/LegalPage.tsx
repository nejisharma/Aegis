import Link from 'next/link';
import type { ReactNode } from 'react';
import { AegisLogo } from '@/components/ui/AegisLogo';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#060a13] text-slate-200">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <header className="mb-8 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <AegisLogo size={32} />
            <span className="text-lg font-bold tracking-widest text-white">AEGIS</span>
          </Link>
        </header>
        <h1 className="mb-1 text-3xl font-bold text-white">{title}</h1>
        <p className="mb-8 text-sm text-slate-500">Last updated: {updated}</p>
        <article className="legal space-y-6 text-[15px] leading-7 text-slate-300">{children}</article>
        <footer className="mt-12 flex flex-wrap gap-4 border-t border-[#1e293b] pt-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-cyan-300">Home</Link>
          <Link href="/privacy" className="hover:text-cyan-300">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-cyan-300">Terms &amp; Conditions</Link>
          <a href="https://neeraj.ca" className="ml-auto hover:text-cyan-300">neeraj.ca</a>
        </footer>
      </div>
    </main>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 text-xl font-semibold text-white">{children}</h2>;
}
