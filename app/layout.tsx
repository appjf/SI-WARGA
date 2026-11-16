import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GGR-ICMS — Green Garden Residence",
  description:
    "Integrated Community Management System untuk RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut.",
  openGraph: {
    title: "GGR-ICMS — Green Garden Residence",
    description:
      "Integrated Community Management System untuk RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GGR-ICMS — Green Garden Residence",
    description:
      "Integrated Community Management System untuk RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kecamatan Banyuresmi, Kabupaten Garut.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
