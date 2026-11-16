import {
  CheckCircle2,
  Clock,
  FolderGit2,
  Layers,
  Lock,
} from 'lucide-react';
import { PublicShell } from '@/layouts/PublicShell';
import { COMMUNITY_IDENTITY } from '@/styles/tokens';
import type { ModuleBoundary } from '@/types';

const SCAFFOLD_BOUNDARIES: readonly ModuleBoundary[] = [
  {
    directory: 'app/',
    layer: 'presentation',
    responsibility: 'Next.js App Router, entry layout, dan rute placeholder awal.',
  },
  {
    directory: 'components/ & layouts/',
    layer: 'presentation',
    responsibility: 'Komponen antarmuka reusable dan kerangka tata letak lintas peran.',
  },
  {
    directory: 'features/ & services/',
    layer: 'domain-ui',
    responsibility: 'Modul domain frontend dan klien komunikasi API terstruktur (Tahap 5–6).',
  },
  {
    directory: 'server/',
    layer: 'server',
    responsibility: 'Otorisasi RBAC, audit logging, validasi, dan logika bisnis server-side.',
  },
  {
    directory: 'gis-service/',
    layer: 'gis',
    responsibility: 'Layanan FastAPI + GeoPandas + PostGIS terpisah untuk data spasial (Tahap 7).',
  },
  {
    directory: 'docs/',
    layer: 'docs',
    responsibility: 'Blueprint arsitektur, SRS, ADR, keamanan, dan panduan operasional.',
  },
];

export default function HomePage() {
  return (
    <PublicShell>
      <div className="space-y-8">
        <section className="rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#1F5E4A]">
            <FolderGit2 className="h-4 w-4" aria-hidden="true" />
            <span>Tahap 1 — Repository &amp; Application Scaffolding</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#1F2933] sm:text-3xl">
            {COMMUNITY_IDENTITY.name}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#667085] sm:text-base">
            Kerangka aplikasi dasar untuk pengelolaan layanan administrasi, transparansi
            keuangan lingkungan, pengaduan warga, dan informasi geospasial pada wilayah{' '}
            <span className="font-medium text-[#1F2933]">
              {COMMUNITY_IDENTITY.areaLabel}
            </span>
            .
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border border-[#E4E7EC] bg-[#F7F8F6] p-4">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-[#217A45]"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-[#1F2933]">
                  Fondasi Terinisialisasi
                </p>
                <p className="mt-0.5 text-xs text-[#667085]">
                  Struktur Next.js App Router, TypeScript strict, dan Git baseline siap.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-[#E4E7EC] bg-[#F7F8F6] p-4">
              <Lock
                className="mt-0.5 h-5 w-5 shrink-0 text-[#A15C00]"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-[#1F2933]">
                  Gerbang Persetujuan Aktif
                </p>
                <p className="mt-0.5 text-xs text-[#667085]">
                  Belum terhubung ke Firebase, database operasional, atau layanan GIS.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-[#E4E7EC] bg-[#F7F8F6] p-4">
              <Clock
                className="mt-0.5 h-5 w-5 shrink-0 text-[#1F5E4A]"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-[#1F2933]">
                  Tahap Berikutnya
                </p>
                <p className="mt-0.5 text-xs text-[#667085]">
                  Menunggu persetujuan eksplisit untuk Tahap 2 (instalasi &amp; audit dependency).
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="architecture-boundaries-heading"
          className="rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-xs sm:p-8"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#1F5E4A]" aria-hidden="true" />
            <h2
              id="architecture-boundaries-heading"
              className="text-lg font-semibold text-[#1F2933]"
            >
              Struktur &amp; Batas Arsitektur Modular
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#667085]">
            Pemisahan tanggung jawab antara antarmuka, layanan server-side, dan layanan GIS.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SCAFFOLD_BOUNDARIES.map((item) => (
              <div
                key={item.directory}
                className="rounded-lg border border-[#E4E7EC] p-4"
              >
                <p className="font-mono text-xs font-semibold text-[#1F5E4A]">
                  {item.directory}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#667085]">
                  {item.responsibility}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
