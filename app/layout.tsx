import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GGR-ICMS — Green Garden Residence',
  description:
    'Integrated Community Management System untuk RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut.',
  openGraph: {
    title: 'GGR-ICMS — Green Garden Residence',
    description:
      'Integrated Community Management System untuk RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GGR-ICMS — Green Garden Residence',
    description:
      'Integrated Community Management System untuk RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
