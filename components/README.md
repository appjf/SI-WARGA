# UI Components (`components/`)

Kumpulan komponen antarmuka reusable yang mengikuti `05-UI-UX-Design-System.md`.

## Rencana Subdirektori

- `ui/` — Komponen dasar (tombol, input, dialog konfirmasi, indikator status, form field).
- `layout/` — Header, sidebar/drawer, bottom navigation mobile-first.
- `data-display/` — Data table responsif (mobile card list fallback), timeline status, dashboard card.
- `feedback/` — Loading state, empty state, error state aman, permission denied state.
- `maps/` — Komponen kontainer peta Leaflet/MapLibre, panel legenda, daftar fitur aksesibel.

## Ketentuan

- Seluruh komponen wajib mendukung navigasi keyboard, kontras memadai (WCAG 2.2 AA), dan tidak mengandalkan warna saja untuk status.
- Penamaan file dan komponen menggunakan `PascalCase` saat tahap coding dimulai.
