import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { COMMUNITY_IDENTITY } from '@/styles/tokens';

interface PublicShellProps {
  readonly children: ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F6] text-[#1F2933] font-sans antialiased">
      <header className="border-b border-[#E4E7EC] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F5E4A] text-white"
              aria-hidden="true"
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-[#1F5E4A]">
                {COMMUNITY_IDENTITY.code}
              </p>
              <p className="text-xs text-[#667085]">
                Green Garden Residence · RT 06 RW 01
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-md border border-[#1F5E4A]/20 bg-[#1F5E4A]/5 px-2.5 py-1 text-xs font-medium text-[#1F5E4A]">
            Phase 1 Scaffold
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>

      <footer className="border-t border-[#E4E7EC] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-5 text-xs text-[#667085] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{COMMUNITY_IDENTITY.areaLabel}</p>
          <p>Baseline v1.0 · Zona Waktu Tampilan: {COMMUNITY_IDENTITY.displayTimeZone}</p>
        </div>
      </footer>
    </div>
  );
}
