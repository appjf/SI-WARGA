import { COMMUNITY_IDENTITY } from "@/styles/tokens";

/**
 * Formats an integer Rupiah amount in Indonesian locale (IDR).
 */
export function formatIdr(amount: number | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "Rp 0";
  }
  return new Intl.NumberFormat(COMMUNITY_IDENTITY.locale, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Normalizes Firestore Timestamp, serialized {_seconds}, ISO string, or Date into a JS Date.
 */
export function parseTimestamp(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.toDate === "function") {
      try {
        return (obj as { toDate: () => Date }).toDate();
      } catch {
        return null;
      }
    }
    const seconds =
      typeof obj.seconds === "number"
        ? obj.seconds
        : typeof obj._seconds === "number"
          ? obj._seconds
          : null;
    if (seconds !== null) {
      return new Date(seconds * 1000);
    }
  }
  return null;
}

export function formatDateTimeJakarta(value: unknown): string {
  const date = parseTimestamp(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(COMMUNITY_IDENTITY.locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: COMMUNITY_IDENTITY.displayTimeZone,
  }).format(date);
}

export function formatDateJakarta(value: unknown): string {
  const date = parseTimestamp(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(COMMUNITY_IDENTITY.locale, {
    dateStyle: "medium",
    timeZone: COMMUNITY_IDENTITY.displayTimeZone,
  }).format(date);
}

/**
 * Converts WGS84 geographic coordinates (EPSG:4326) to UTM Zone 48S (EPSG:32748)
 * applicable for Garut, West Java, Indonesia (central meridian 105°E).
 */
export function convertEpsg4326ToUtm48S(
  longitude: number,
  latitude: number
): { easting: number; northing: number; zone: "48S"; srid: 32748 } {
  const a = 6378137.0; // WGS84 semi-major axis
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);

  const lon0 = (105 * Math.PI) / 180; // Zone 48 central meridian = 105°E
  const latRad = (latitude * Math.PI) / 180;
  const lonRad = (longitude * Math.PI) / 180;

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const tanLat = Math.tan(latRad);

  const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  const T = tanLat * tanLat;
  const C = ep2 * cosLat * cosLat;
  const A = cosLat * (lonRad - lon0);

  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256) * latRad -
      ((3 * e2) / 8 + (3 * e2 * e2) / 32 + (45 * e2 * e2 * e2) / 1024) *
        Math.sin(2 * latRad) +
      ((15 * e2 * e2) / 256 + (45 * e2 * e2 * e2) / 1024) *
        Math.sin(4 * latRad) -
      ((35 * e2 * e2 * e2) / 3072) * Math.sin(6 * latRad));

  const easting =
    500000 +
    k0 *
      N *
      (A +
        ((1 - T + C) * Math.pow(A, 3)) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * Math.pow(A, 5)) / 120);

  let northing =
    k0 *
    (M +
      N *
        tanLat *
        (Math.pow(A, 2) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4)) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * Math.pow(A, 6)) /
            720));

  if (latitude < 0) {
    northing += 10000000; // Southern hemisphere false northing
  }

  return {
    easting: Math.round(easting * 100) / 100,
    northing: Math.round(northing * 100) / 100,
    zone: "48S",
    srid: 32748,
  };
}

/**
 * Haversine distance in meters between two EPSG:4326 points.
 */
export function haversineDistanceMeters(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
