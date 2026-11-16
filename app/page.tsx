import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Home,
  MessageSquareWarning,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { PublicShell } from "@/layouts/PublicShell";
import { COMMUNITY_IDENTITY } from "@/styles/tokens";
import heroImage from "@/src/assets/images/hero_green_garden_residence_1794821538700.jpg";

export default function HomePage() {
  return (
    <PublicShell>
      <div className="space-y-16">
        {/* Hero Split */}
        <section className="grid items-stretch gap-8 lg:grid-cols-12">
          <div className="flex flex-col justify-between rounded-xl border border-[#E4E7EC] bg-white p-6 sm:p-8 lg:col-span-6">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#1F5E4A]">
                RT 06 RW 01 · Desa Cipicung, Banyuresmi, Garut
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1F2933] sm:text-4xl">
                Tata Kelola Lingkungan Terpadu untuk Green Garden Residence
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#667085]">
                Platform layanan warga dan pengurus untuk pengelolaan data rumah
                tangga, transparansi kas lingkungan, tindak lanjut pengaduan,
                serta pemetaan aset prasarana berbasis geospasial.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1F5E4A] px-5 py-2.5 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-[#174939] focus-visible:outline-2 focus-visible:outline-[#1F5E4A]"
              >
                <span>Masuk ke Portal</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#layanan"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#E4E7EC] bg-white px-5 py-2.5 text-sm font-medium whitespace-nowrap text-[#1F2933] transition-colors hover:bg-[#F7F8F6] focus-visible:outline-2 focus-visible:outline-[#1F5E4A]"
              >
                Lihat Modul Layanan
              </a>
            </div>
          </div>

          <div className="relative min-h-72 overflow-hidden rounded-xl border border-[#E4E7EC] bg-[#EFF2EE] lg:col-span-6">
            <Image
              src={heroImage}
              alt="Kawasan hunian hijau Perum Green Garden Residence di Banyuresmi, Garut"
              fill
              priority
              referrerPolicy="no-referrer"
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-5 text-white">
              <p className="text-xs font-medium text-white/90">
                Wilayah Operasional Resmi
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                {COMMUNITY_IDENTITY.areaLabel}
              </p>
            </div>
          </div>
        </section>

        {/* Core Civic Capabilities */}
        <section id="layanan" className="space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-[#1F2933]">
              Layanan Utama Warga &amp; Pengurus
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#667085]">
              Seluruh proses administrasi lingkungan dijalankan dengan kontrol
              hak akses berbasis peran, validasi data terpusat, dan jejak audit.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-[#E4E7EC] bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F5E4A]/10 text-[#1F5E4A]">
                <Home className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#1F2933]">
                Kependudukan &amp; Rumah Tangga
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#667085]">
                Direktori warga dan unit rumah dengan perlindungan data pribadi
                (masking NIK dan kontak sesuai kewenangan peran).
              </p>
            </article>

            <article
              id="keuangan"
              className="rounded-xl border border-[#E4E7EC] bg-white p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F5E4A]/10 text-[#1F5E4A]">
                <Wallet className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#1F2933]">
                Akuntabilitas Kas RT
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#667085]">
                Pencatatan pemasukan dan pengeluaran berbasis integer Rupiah,
                kunci idempotensi, pemisahan tugas persetujuan, serta reversal.
              </p>
            </article>

            <article className="rounded-xl border border-[#E4E7EC] bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F5E4A]/10 text-[#1F5E4A]">
                <MessageSquareWarning className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#1F2933]">
                Pengaduan Terstruktur
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#667085]">
                Pelaporan kendala fasilitas, keamanan, atau drainase dengan
                penugasan petugas dan riwayat status transparan.
              </p>
            </article>

            <article
              id="spasial"
              className="rounded-xl border border-[#E4E7EC] bg-white p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F5E4A]/10 text-[#1F5E4A]">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#1F2933]">
                Peta &amp; Aset Spasial
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#667085]">
                Visualisasi batas RT/RW, persil rumah, jalan, drainase, dan
                inventaris aset prasarana dalam koordinat EPSG:4326 &amp;
                EPSG:32748.
              </p>
            </article>
          </div>
        </section>

        {/* Governance & Security Guarantee */}
        <section
          id="tata-kelola"
          className="rounded-xl border border-[#E4E7EC] bg-white p-6 sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-3 lg:col-span-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1F5E4A]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>Keamanan &amp; Otorisasi Server-Side</span>
              </div>
              <h2 className="text-xl font-bold text-[#1F2933] sm:text-2xl">
                Akses Terkendali untuk Warga dan 7 Peran Kepengurusan
              </h2>
              <p className="text-sm leading-relaxed text-[#667085]">
                Setiap permintaan melewati lapisan BFF API terverifikasi token
                Firebase Auth dengan pemeriksaan revokasi dan penegakan izin di
                server (Super Admin, Admin RW, Ketua RT, Sekretaris RT,
                Bendahara RT, Pengurus, dan Warga).
              </p>
            </div>
            <div className="flex lg:col-span-4 lg:justify-end">
              <Link
                href="/login"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1F5E4A] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#174939] lg:w-auto"
              >
                <span>Masuk dengan Akun Terdaftar</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
