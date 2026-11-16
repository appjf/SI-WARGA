"use client";

import { auth } from "@/lib/firebase/client";
import type {
  ApiResponse,
  VerifiedSessionProfile,
  DashboardReportData,
  ResidentRecord,
  HouseholdRecord,
  TransactionRecord,
  ComplaintRecord,
  NotificationRecord,
  AnnouncementRecord,
  SpatialAssetRecord,
  GeoJsonFeatureCollection,
  SpatialLayerType,
} from "@/types";
import type { Role } from "@/lib/rbac/matrix";

export class BffClientError extends Error {
  public status: number;
  public code: string;
  public requestId?: string;

  constructor(
    message: string,
    status: number,
    code: string = "BFF_ERROR",
    requestId?: string
  ) {
    super(message);
    this.name = "BffClientError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

async function getAuthHeaders(extra?: Record<string, string>): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extra,
  };

  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  explicitToken?: string
): Promise<ApiResponse<T>> {
  const baseHeaders: Record<string, string> = {};
  if (options.body) {
    baseHeaders["Content-Type"] = "application/json";
  }
  if (explicitToken) {
    baseHeaders.Authorization = `Bearer ${explicitToken}`;
  }

  const headers = explicitToken
    ? { Accept: "application/json", ...baseHeaders }
    : await getAuthHeaders(baseHeaders);

  const response = await fetch(path, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({
    success: false,
    error: {
      code: "INVALID_RESPONSE",
      message: "Respons server tidak dapat dibaca.",
    },
  }))) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new BffClientError(
      payload.error?.message || `Permintaan gagal (HTTP ${response.status})`,
      response.status,
      payload.error?.code || "REQUEST_FAILED",
      payload.meta?.requestId
    );
  }

  return payload;
}

export const bffApi = {
  // Public Health
  health: () =>
    requestJson<{
      service: string;
      version: string;
      operationalArea: string;
      status: string;
      timestamp: string;
    }>("/api/v1/health"),

  // Auth & Profile (WP-6B)
  verifyToken: (idToken: string) =>
    requestJson<{
      uid: string;
      email: string | null;
      roles: Role[];
      status: string;
      residentId: string | null;
      houseId: string | null;
    }>(
      "/api/v1/auth/verify",
      { method: "POST", body: JSON.stringify({ idToken }) },
      idToken
    ),

  getMe: () => requestJson<VerifiedSessionProfile>("/api/v1/me"),

  updateMe: (data: { displayName: string }) =>
    requestJson<VerifiedSessionProfile>("/api/v1/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Dashboard & Analytics (WP-6H, WP-6I)
  getDashboard: () => requestJson<DashboardReportData>("/api/v1/reports/dashboard"),

  getAnalytics: (exportFormat?: "csv" | "json") =>
    requestJson<{
      generatedAt: string;
      operationalArea: string;
      residents: {
        total: number;
        verified: number;
        pending: number;
        byFamilyRole: Record<string, number>;
        totalHouseholds: number;
      };
      complaints: {
        total: number;
        byStatus: Record<string, number>;
        byCategory: Record<string, number>;
        byPriority: Record<string, number>;
      };
      assets: {
        total: number;
        totalValueIdr: number;
        byCondition: Record<string, number>;
        byLayer: Record<string, number>;
      };
      finance: {
        totalIncome: number;
        totalExpense: number;
        balance: number;
        pendingCount: number;
        postedCount: number;
        byPeriod: Array<{ period: string; income: number; expense: number }>;
        byCategory: Record<string, number>;
      } | null;
    }>(
      exportFormat
        ? `/api/v1/reports/analytics?export=${exportFormat}`
        : "/api/v1/reports/analytics"
    ),

  // Residents & Households (WP-6C)
  listResidents: (params?: { search?: string; houseId?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.houseId) qs.set("houseId", params.houseId);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return requestJson<ResidentRecord[]>(
      `/api/v1/residents${query ? `?${query}` : ""}`
    );
  },

  getResident: (id: string) =>
    requestJson<ResidentRecord>(`/api/v1/residents/${encodeURIComponent(id)}`),

  createResident: (data: Record<string, unknown>) =>
    requestJson<ResidentRecord>("/api/v1/residents", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateResident: (id: string, data: Record<string, unknown>) =>
    requestJson<ResidentRecord>(`/api/v1/residents/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  listHouseholds: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return requestJson<HouseholdRecord[]>(`/api/v1/households${qs}`);
  },

  createHousehold: (data: Record<string, unknown>) =>
    requestJson<HouseholdRecord>("/api/v1/households", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateHousehold: (id: string, data: Record<string, unknown>) =>
    requestJson<HouseholdRecord>(`/api/v1/households/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Finance (WP-6D)
  listTransactions: (params?: {
    type?: string;
    status?: string;
    period?: string;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.status) qs.set("status", params.status);
    if (params?.period) qs.set("period", params.period);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return requestJson<TransactionRecord[]>(
      `/api/v1/finance${query ? `?${query}` : ""}`
    );
  },

  createTransaction: (data: {
    type: "income" | "expense";
    amount: number;
    categoryId: string;
    period: string;
    description?: string;
    idempotencyKey?: string;
  }) =>
    requestJson<TransactionRecord>("/api/v1/finance", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  approveTransaction: (
    transactionId: string,
    data: { action: "APPROVE" | "REJECT"; rejectionReason?: string }
  ) =>
    requestJson<TransactionRecord>(
      `/api/v1/finance/${encodeURIComponent(transactionId)}/approve`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  reverseTransaction: (data: {
    originalTransactionId: string;
    reason: string;
    idempotencyKey?: string;
  }) =>
    requestJson<{
      reversalTransaction: TransactionRecord;
      originalTransaction: TransactionRecord;
    }>("/api/v1/finance/reversal", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Complaints (WP-6E)
  listComplaints: (params?: { status?: string; category?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.category) qs.set("category", params.category);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return requestJson<ComplaintRecord[]>(
      `/api/v1/complaints${query ? `?${query}` : ""}`
    );
  },

  getComplaint: (ticketId: string) =>
    requestJson<ComplaintRecord>(
      `/api/v1/complaints/${encodeURIComponent(ticketId)}`
    ),

  createComplaint: (data: {
    category: string;
    title?: string;
    description: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    spatialId?: string | null;
    locationDescription?: string;
  }) =>
    requestJson<ComplaintRecord>("/api/v1/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  transitionComplaintStatus: (
    ticketId: string,
    data: {
      status: string;
      notes?: string;
      assignedTo?: string;
      officerName?: string;
      rejectionReason?: string;
    }
  ) =>
    requestJson<ComplaintRecord>(
      `/api/v1/complaints/${encodeURIComponent(ticketId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),

  // Notifications & Announcements (WP-6G)
  listNotifications: (unreadOnly?: boolean) =>
    requestJson<NotificationRecord[]>(
      `/api/v1/notifications${unreadOnly ? "?unreadOnly=true" : ""}`
    ),

  markNotificationRead: (id: string) =>
    requestJson<NotificationRecord>(
      `/api/v1/notifications/${encodeURIComponent(id)}/read`,
      { method: "PATCH" }
    ),

  sendNotification: (data: {
    recipientUid: string;
    title: string;
    message: string;
    type: string;
    link?: string;
  }) =>
    requestJson<NotificationRecord>("/api/v1/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listAnnouncements: (category?: string) =>
    requestJson<AnnouncementRecord[]>(
      `/api/v1/announcements${category && category !== "ALL" ? `?category=${encodeURIComponent(category)}` : ""}`
    ),

  publishAnnouncement: (data: {
    title: string;
    content: string;
    category: string;
    audience: "ALL_WARGA" | "PENGURUS_ONLY";
    isPinned: boolean;
    broadcastNotification: boolean;
  }) =>
    requestJson<AnnouncementRecord>("/api/v1/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // GIS Proxy & Spatial Asset Management (WP-6F)
  fetchGisLayer: (layer: SpatialLayerType) =>
    requestJson<GeoJsonFeatureCollection>(`/api/v1/gis/${layer}`),

  executeSpatialQuery: (payload: {
    layer_type: SpatialLayerType;
    coordinates: [number, number];
    buffer_meters: number;
  }) =>
    requestJson<{
      status: string;
      layer_type: string;
      buffer_meters: number;
      matched_features_count: number;
      message: string;
    }>("/api/v1/gis/spatial-query", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  validateGisGeometry: (payload: {
    geometry: Record<string, unknown>;
    expected_srid?: number;
  }) =>
    requestJson<{
      is_valid: boolean;
      srid: number;
      message: string;
    }>("/api/v1/gis/validate-geometry", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listSpatialAssets: (params?: {
    layerType?: string;
    condition?: string;
    search?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.layerType && params.layerType !== "ALL")
      qs.set("layerType", params.layerType);
    if (params?.condition && params.condition !== "ALL")
      qs.set("condition", params.condition);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    return requestJson<SpatialAssetRecord[]>(
      `/api/v1/spatial-assets${query ? `?${query}` : ""}`
    );
  },

  createSpatialAsset: (data: Record<string, unknown>) =>
    requestJson<SpatialAssetRecord>("/api/v1/spatial-assets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSpatialAsset: (assetId: string, data: Record<string, unknown>) =>
    requestJson<SpatialAssetRecord>(
      `/api/v1/spatial-assets/${encodeURIComponent(assetId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),

  // Admin Users & Roles (WP-6H)
  listAdminUsers: () =>
    requestJson<
      Array<{
        uid: string;
        email: string;
        displayName: string;
        roles: Role[];
        status: "active" | "inactive" | "disabled" | "pending";
        residentId: string | null;
        houseId: string | null;
      }>
    >("/api/v1/admin/users"),

  updateAdminUser: (
    uid: string,
    data: {
      roles?: Role[];
      status?: "active" | "inactive" | "disabled" | "pending";
      residentId?: string | null;
      houseId?: string | null;
    }
  ) =>
    requestJson<Record<string, unknown>>(
      `/api/v1/admin/users/${encodeURIComponent(uid)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),
};
