import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { PublicShell } from '@/layouts/PublicShell';

export default function NotFound() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-lg rounded-xl border border-[#E4E7EC] bg-white p-8 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1F5E4A]/10 text-[#1F5E4A]"
          aria-hidden="true"
        >
          <FileQuestion className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-[#1F2933]">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-2 text-sm text-[#667085]">
          Rute yang diminta belum tersedia pada tahap scaffolding aplikasi saat ini.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-[#1F5E4A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#174939]"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
