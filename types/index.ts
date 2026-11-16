/**
 * Shared foundational TypeScript types for GGR-ICMS Phase 1 scaffolding.
 * Domain entity contracts (residents, finance, administration, GIS) will be
 * added in Phase 3+ after schema and API contract verification.
 */

export type DeliveryGateStatus = 'completed' | 'in_progress' | 'pending';

export interface CommunityIdentity {
  readonly code: string;
  readonly name: string;
  readonly areaLabel: string;
  readonly locale: string;
  readonly displayTimeZone: string;
}

export interface ModuleBoundary {
  readonly directory: string;
  readonly layer: 'presentation' | 'domain-ui' | 'server' | 'gis' | 'docs';
  readonly responsibility: string;
}
