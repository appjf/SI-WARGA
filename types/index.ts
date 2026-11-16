import type { Role, Permission } from "@/lib/rbac/matrix";

export type DeliveryGateStatus = "completed" | "in_progress" | "pending";

export interface CommunityIdentity {
  readonly code: string;
  readonly name: string;
  readonly areaLabel: string;
  readonly locale: string;
  readonly displayTimeZone: string;
}

export interface ModuleBoundary {
  readonly directory: string;
  readonly layer: "presentation" | "domain-ui" | "server" | "gis" | "docs";
  readonly responsibility: string;
}

export interface ApiMeta {
  requestId?: string;
  count?: number;
  limit?: number;
  idempotentReplay?: boolean;
  layer?: string;
  status?: string;
  newStatus?: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Array<{ field?: string; reason?: string }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  meta?: ApiMeta;
}

export interface VerifiedSessionProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  roles: Role[];
  permissions: Permission[];
  status: "active" | "inactive" | "disabled" | "pending";
  residentId: string | null;
  houseId: string | null;
}

export interface HouseholdRecord {
  houseId: string;
  houseCode: string;
  blockName: string;
  addressLabel: string;
  occupancyStatus: "OCCUPIED" | "VACANT" | "RENTED";
  headResidentId?: string | null;
  headResidentName?: string | null;
  memberCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ResidentRecord {
  residentId: string;
  uid?: string | null;
  fullName: string;
  houseId: string;
  nik?: string;
  gender?: "LAKI_LAKI" | "PEREMPUAN";
  birthDate?: string;
  birthPlace?: string;
  religion?: string;
  maritalStatus?: string;
  occupation?: string;
  familyRole: "KEPALA_KELUARGA" | "ISTRI" | "ANAK" | "FAMILI_LAIN";
  isHeadOfFamily: boolean;
  contact?: {
    phone?: string;
    email?: string;
    waNumber?: string;
  };
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
  };
  verificationStatus: "verified" | "pending" | "unverified";
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TransactionRecord {
  transactionId: string;
  type: "income" | "expense";
  amount: number;
  currency: "IDR";
  categoryId: string;
  period: string;
  description: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "POSTED" | "REVERSED";
  idempotencyKey: string;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  postedAt?: unknown;
  approvedBy?: string;
  approvedAt?: unknown;
  rejectedBy?: string;
  rejectedAt?: unknown;
  rejectionReason?: string;
  isReversal?: boolean;
  originalTransactionId?: string;
  reversalTransactionId?: string;
  reversalReason?: string;
}

export type ComplaintStatus =
  | "SUBMITTED"
  | "VERIFIED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REJECTED";

export interface ComplaintStatusHistoryEntry {
  fromStatus: ComplaintStatus;
  toStatus: ComplaintStatus;
  changedBy: string;
  timestamp: string;
  notes?: string;
  assignedTo?: string;
  officerName?: string;
  rejectionReason?: string;
}

export interface ComplaintRecord {
  ticketId: string;
  reporterId: string;
  category: string;
  title?: string;
  description: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: ComplaintStatus;
  spatialId?: string | null;
  locationDescription?: string;
  assignedTo?: string;
  officerName?: string;
  rejectionReason?: string;
  statusHistory: ComplaintStatusHistoryEntry[];
  createdAt?: unknown;
  updatedAt?: unknown;
  resolvedAt?: unknown;
  closedAt?: unknown;
}

export interface NotificationRecord {
  id: string;
  recipientUid: string;
  title: string;
  message: string;
  type: "BILLING" | "COMPLAINT" | "ANNOUNCEMENT" | "APPROVAL" | "SYSTEM" | string;
  link?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: unknown;
  createdAt?: unknown;
  createdBy: string;
}

export interface AnnouncementRecord {
  announcementId: string;
  title: string;
  content: string;
  category: "KEGIATAN" | "KEUANGAN" | "KEAMANAN" | "INFRASTRUKTUR" | "UMUM";
  audience: "ALL_WARGA" | "PENGURUS_ONLY";
  isPinned: boolean;
  publishedBy: string;
  publishedByName?: string;
  publishedAt?: unknown;
  expiresAt?: string | null;
}

export type SpatialLayerType =
  | "boundaries"
  | "houses"
  | "roads"
  | "drainage"
  | "facilities"
  | "assets";

export type AssetCondition = "GOOD" | "FAIR" | "POOR" | "CRITICAL";
export type OperationalStatus = "ACTIVE" | "MAINTENANCE" | "DECOMMISSIONED";

export interface AssetInspectionEntry {
  inspectionId: string;
  inspectedAt: string;
  inspectorName: string;
  inspectorUid: string;
  conditionAfter: AssetCondition;
  notes: string;
  maintenanceCostIdr?: number;
}

export interface AssetChangeLogEntry {
  changedAt: string;
  changedBy: string;
  summary: string;
}

export interface SpatialAssetRecord {
  assetId: string;
  assetCode: string;
  name: string;
  layerType: SpatialLayerType;
  category: string;
  subCategory?: string;
  coordinates: {
    longitude: number;
    latitude: number;
    srid: 4326;
    utmEasting?: number;
    utmNorthing?: number;
    utmZone?: "48S";
  };
  geometry: {
    type: "Point" | "LineString" | "MultiLineString" | "Polygon";
    coordinates: unknown;
  };
  condition: AssetCondition;
  acquisitionYear: number;
  assetValueIdr: number;
  picName: string;
  picContact?: string;
  photoUrl?: string;
  photoCaption?: string;
  operationalStatus: OperationalStatus;
  inspectionHistory: AssetInspectionEntry[];
  changeHistory: AssetChangeLogEntry[];
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
}

export interface GeoJsonFeature {
  id: string;
  type: "Feature";
  geometry: {
    type: string;
    coordinates: unknown;
  };
  properties: Record<string, unknown>;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface DashboardReportData {
  operationalArea: string;
  totalResidents: number;
  totalHouseholds: number;
  totalComplaints: number;
  financialSummary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    currency: string;
  } | null;
  notice?: string;
}
