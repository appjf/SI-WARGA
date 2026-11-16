/**
 * GGR-ICMS Design System Tokens (Baseline from docs/05-UI-UX-Design-System.md).
 * Kept as typed constants for Phase 1 scaffolding prior to full UI library setup.
 */

export const DESIGN_TOKENS = {
  colors: {
    primary: '#1F5E4A',
    secondary: '#D9A441',
    background: '#F7F8F6',
    surface: '#FFFFFF',
    text: '#1F2933',
    muted: '#667085',
    success: '#217A45',
    warning: '#A15C00',
    danger: '#B42318',
  },
  radii: {
    card: '12px',
  },
  spacing: {
    baseUnitPx: 4,
  },
} as const;

export const COMMUNITY_IDENTITY = {
  code: 'GGR-ICMS',
  name: 'Green Garden Residence – Integrated Community Management System',
  areaLabel:
    'RT 06 RW 01, Perum Green Garden Residence, Desa Cipicung, Kec. Banyuresmi, Kab. Garut',
  locale: 'id-ID',
  displayTimeZone: 'Asia/Jakarta',
} as const;
