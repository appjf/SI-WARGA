import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { COMMUNITY_IDENTITY } from "@/styles/tokens";

interface PublicShellProps {
  readonly children: ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8F6] text-[#1F2933] antialiased">
      <header className="border-b border-[#E4E7EC] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-base font-bold tracking-tight text-[#1F5E4A]"
          >
            <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{COMMUNITY_IDENTITY.code}</span>
          </Link>

          <nav
            aria-label="Navigasi publik"
            className="hidden items-center gap-6 text-sm font-medium text-[#667085] md:flex"
          >
            <a
              href="#layanan"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#1F2933]"
            >
              Layanan Warga
            </a>
            <a
              href="#keuangan"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#1F2933]"
            >
              Transparansi Kas
            </a>
            <a
              href="#spasial"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#1F2933]"
            >
              Peta Lingkungan
            </a>
            <a
              href="#tata-kelola"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#1F2933]"
            >
              Tata Kelola RT
            </a>
          </nav>

          <div className="flex shrink-0 items-center">
            <Link
              href="/login"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[#1F5E4A] px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-[#174939] focus-visible:outline-2 focus-visible:outline-[#1F5E4A]"
            >
              Masuk Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>

      <footer className="border-t border-[#E4E7EC] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-[#667085] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{COMMUNITY_IDENTITY.areaLabel}</p>
          <p>
            Zona Waktu: {COMMUNITY_IDENTITY.displayTimeZone} · Sistem Administrasi
            Terpadu
          </p>
        </div>
      </footer>
    </div>
  );
}
