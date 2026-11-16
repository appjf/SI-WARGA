"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Crosshair,
  Eye,
  History,
  Image as ImageIcon,
  Layers,
  List,
  Map as MapIcon,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { bffApi, BffClientError } from "@/services/api-client";
import {
  convertEpsg4326ToUtm48S,
  formatDateTimeJakarta,
  formatIdr,
  haversineDistanceMeters,
} from "@/lib/formatters";
import {
  RT06_BASELINE_FEATURES,
  RT06_DEFAULT_CENTER,
  SPATIAL_LAYERS,
} from "./gis-baseline";
import { InteractiveGisMap, type MapFeatureItem } from "./InteractiveGisMap";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import {
  FormField,
  SelectInput,
  TextareaInput,
  TextInput,
} from "@/components/ui/FormFields";
import { ErrorState, ForbiddenState, LoadingSkeleton } from "@/components/ui/States";
import { getConditionStatusMeta, StatusText } from "@/components/ui/StatusText";
import type {
  AssetCondition,
  GeoJsonFeature,
  OperationalStatus,
  SpatialAssetRecord,
  SpatialLayerType,
} from "@/types";

export function GisWorkspace() {
  const router = useRouter();
  const { can } = useAuth();
  const { showToast } = useToast();

  const canRead = can("gis:read");
  const canWrite = can("gis:write");

  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assets, setAssets] = useState<SpatialAssetRecord[]>([]);
  const [proxyLayers, setProxyLayers] = useState<
    Partial<Record<SpatialLayerType, GeoJsonFeature[]>>
  >({});
  const [gisServiceOnline, setGisServiceOnline] = useState<boolean>(false);

  const [activeLayers, setActiveLayers] = useState<Record<SpatialLayerType, boolean>>({
    boundaries: true,
    houses: true,
    roads: true,
    drainage: true,
    facilities: true,
    assets: true,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [selectedFeature, setSelectedFeature] = useState<MapFeatureItem | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<SpatialAssetRecord | null>(null);

  // Spatial Query Panel
  const [pickMode, setPickMode] = useState(false);
  const [queryLon, setQueryLon] = useState(String(RT06_DEFAULT_CENTER[0]));
  const [queryLat, setQueryLat] = useState(String(RT06_DEFAULT_CENTER[1]));
  const [queryRadius, setQueryRadius] = useState("100");
  const [queryLayer, setQueryLayer] = useState<SpatialLayerType>("assets");
  const [queryResult, setQueryResult] = useState<{
    source: "fastapi" | "client-haversine";
    matchedCount: number;
    message: string;
    matchedAssets: Array<{ assetCode: string; name: string; distanceMeters: number }>;
  } | null>(null);
  const [runningQuery, setRunningQuery] = useState(false);

  // Geometry Validator Modal
  const [validatorOpen, setValidatorOpen] = useState(false);
  const [geometryJson, setGeometryJson] = useState(
    JSON.stringify(
      {
        type: "Point",
        coordinates: RT06_DEFAULT_CENTER,
      },
      null,
      2
    )
  );
  const [expectedSrid, setExpectedSrid] = useState("4326");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    srid: number;
    message: string;
  } | null>(null);
  const [validatingGeom, setValidatingGeom] = useState(false);

  // Create Asset Modal (12 Mandatory Attributes)
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    assetCode: "",
    name: "",
    layerType: "assets" as SpatialLayerType,
    category: "Infrastruktur Lingkungan",
    subCategory: "",
    longitude: String(RT06_DEFAULT_CENTER[0]),
    latitude: String(RT06_DEFAULT_CENTER[1]),
    geometryType: "Point" as "Point" | "LineString" | "Polygon",
    condition: "GOOD" as AssetCondition,
    acquisitionYear: String(new Date().getFullYear()),
    assetValueIdr: "0",
    picName: "",
    picContact: "",
    photoUrl: "",
    photoCaption: "",
    operationalStatus: "ACTIVE" as OperationalStatus,
    notes: "",
  });

  // Inspection / Update Modal
  const [inspectOpen, setInspectOpen] = useState(false);
  const [updatingAsset, setUpdatingAsset] = useState(false);
  const [inspectForm, setInspectForm] = useState({
    conditionAfter: "GOOD" as AssetCondition,
    operationalStatus: "ACTIVE" as OperationalStatus,
    maintenanceCostIdr: "0",
    notes: "",
  });

  const loadSpatialWorkspace = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);

    try {
      const assetsRes = await bffApi.listSpatialAssets();
      setAssets(assetsRes.data || []);

      // Probe GIS BFF proxy layers; if FastAPI service is offline, keep baseline geometry seamlessly
      const layerKeys: SpatialLayerType[] = [
        "boundaries",
        "houses",
        "roads",
        "drainage",
        "facilities",
        "assets",
      ];
      const layerResults = await Promise.allSettled(
        layerKeys.map((layer) => bffApi.fetchGisLayer(layer))
      );

      let anyOnline = false;
      const loaded: Partial<Record<SpatialLayerType, GeoJsonFeature[]>> = {};
      layerResults.forEach((res, idx) => {
        if (res.status === "fulfilled" && res.value.data?.features) {
          anyOnline = true;
          loaded[layerKeys[idx]] = res.value.data.features;
        }
      });

      setGisServiceOnline(anyOnline);
      setProxyLayers(loaded);
    } catch (err) {
      setError(
        err instanceof BffClientError
          ? err.message
          : "Gagal memuat data spasial dan aset RT 06."
      );
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadSpatialWorkspace();
    });
    return () => {
      active = false;
    };
  }, [loadSpatialWorkspace]);

  // Combine GIS BFF features + RT06 baseline + Firestore 12-attribute SpatialAssets
  const allMapFeatures = useMemo<MapFeatureItem[]>(() => {
    const items: MapFeatureItem[] = [];

    for (const layerMeta of SPATIAL_LAYERS) {
      const layerKey = layerMeta.key;
      const proxyList = proxyLayers[layerKey];
      const sourceFeatures =
        proxyList && proxyList.length > 0
          ? proxyList
          : RT06_BASELINE_FEATURES[layerKey];

      sourceFeatures.forEach((feat, index) => {
        const label = String(
          feat.properties?.name ||
            feat.properties?.boundary_name ||
            feat.properties?.road_name ||
            feat.id ||
            `${layerMeta.shortLabel} #${index + 1}`
        );
        items.push({
          id: `${layerKey}:${feat.id || index}`,
          layer: layerKey,
          feature: feat,
          label,
          subtitle: String(feat.properties?.category || layerMeta.label),
        });
      });
    }

    // Add persisted Firestore spatial assets onto the map
    assets.forEach((asset) => {
      if (conditionFilter !== "ALL" && asset.condition !== conditionFilter) {
        return;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hit =
          asset.assetCode.toLowerCase().includes(q) ||
          asset.name.toLowerCase().includes(q) ||
          asset.category.toLowerCase().includes(q) ||
          asset.picName.toLowerCase().includes(q);
        if (!hit) return;
      }

      items.push({
        id: `asset-doc:${asset.assetId}`,
        layer: asset.layerType,
        assetId: asset.assetId,
        label: `${asset.assetCode} — ${asset.name}`,
        subtitle: `${asset.category} · ${formatIdr(asset.assetValueIdr)}`,
        feature: {
          id: asset.assetCode,
          type: "Feature",
          geometry: asset.geometry || {
            type: "Point",
            coordinates: [asset.coordinates.longitude, asset.coordinates.latitude],
          },
          properties: {
            name: asset.name,
            assetCode: asset.assetCode,
            condition: asset.condition,
          },
        },
      });
    });

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return items.filter(
        (i) =>
          i.layer === "boundaries" ||
          i.label.toLowerCase().includes(q) ||
          (i.subtitle || "").toLowerCase().includes(q)
      );
    }

    return items;
  }, [proxyLayers, assets, conditionFilter, searchQuery]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (!activeLayers[a.layerType]) return false;
      if (conditionFilter !== "ALL" && a.condition !== conditionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          a.assetCode.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.picName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assets, activeLayers, conditionFilter, searchQuery]);

  if (!canRead) {
    return (
      <ForbiddenState
        title="Akses Modul GIS Dibatasi"
        message="Akun Anda tidak memiliki izin membaca peta dan aset spasial."
        onAction={() => router.push("/dashboard")}
      />
    );
  }

  const parsedQueryLon = Number(queryLon);
  const parsedQueryLat = Number(queryLat);
  const validQueryCoords =
    Number.isFinite(parsedQueryLon) && Number.isFinite(parsedQueryLat);
  const queryUtmPreview = validQueryCoords
    ? convertEpsg4326ToUtm48S(parsedQueryLon, parsedQueryLat)
    : null;

  const createLon = Number(createForm.longitude);
  const createLat = Number(createForm.latitude);
  const createUtmPreview =
    Number.isFinite(createLon) && Number.isFinite(createLat)
      ? convertEpsg4326ToUtm48S(createLon, createLat)
      : null;

  const handleSelectFeature = (item: MapFeatureItem) => {
    setSelectedFeature(item);
    if (item.assetId) {
      const found = assets.find((a) => a.assetId === item.assetId) || null;
      setSelectedAsset(found);
    } else {
      setSelectedAsset(null);
    }
  };

  const handleRunSpatialQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const lon = Number(queryLon);
    const lat = Number(queryLat);
    const radius = Number(queryRadius);

    if (!Number.isFinite(lon) || !Number.isFinite(lat) || !Number.isFinite(radius) || radius <= 0) {
      showToast({
        variant: "error",
        title: "Parameter query spasial tidak valid",
        description: "Periksa koordinat bujur/lintang dan radius meter.",
      });
      return;
    }

    setRunningQuery(true);
    const matchedAssets = assets
      .filter((a) => a.layerType === queryLayer || queryLayer === "assets")
      .map((a) => ({
        assetCode: a.assetCode,
        name: a.name,
        distanceMeters: haversineDistanceMeters(
          lon,
          lat,
          a.coordinates.longitude,
          a.coordinates.latitude
        ),
      }))
      .filter((m) => m.distanceMeters <= radius)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    try {
      const res = await bffApi.executeSpatialQuery({
        layer_type: queryLayer,
        coordinates: [lon, lat],
        buffer_meters: Math.min(1000, radius),
      });
      setQueryResult({
        source: "fastapi",
        matchedCount: res.data?.matched_features_count ?? matchedAssets.length,
        message: res.data?.message || "Query spasial dieksekusi via FastAPI PostGIS.",
        matchedAssets,
      });
    } catch {
      // Fallback calculation against repository assets when FastAPI port 8000 is offline
      setQueryResult({
        source: "client-haversine",
        matchedCount: matchedAssets.length,
        message:
          "FastAPI GIS tidak aktif di pratinjau ini; jarak dihitung dengan rumus metrik EPSG:4326/UTM 48S terhadap aset terdaftar.",
        matchedAssets,
      });
    } finally {
      setRunningQuery(false);
    }
  };

  const handleValidateGeometry = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsedGeom: Record<string, unknown>;
    try {
      parsedGeom = JSON.parse(geometryJson) as Record<string, unknown>;
    } catch {
      showToast({
        variant: "error",
        title: "Format JSON geometri tidak valid",
        description: "Periksa sintaks GeoJSON yang dimasukkan.",
      });
      return;
    }

    setValidatingGeom(true);
    try {
      const res = await bffApi.validateGisGeometry({
        geometry: parsedGeom,
        expected_srid: Number(expectedSrid) || 4326,
      });
      setValidationResult({
        isValid: Boolean(res.data?.is_valid),
        srid: res.data?.srid || Number(expectedSrid) || 4326,
        message: res.data?.message || "Geometri valid menurut layanan GIS.",
      });
    } catch {
      // Structural GeoJSON topology check when FastAPI service is offline
      const hasType = typeof parsedGeom.type === "string";
      const hasCoords = Array.isArray(parsedGeom.coordinates);
      setValidationResult({
        isValid: hasType && hasCoords,
        srid: Number(expectedSrid) || 4326,
        message:
          hasType && hasCoords
            ? `Struktur GeoJSON ${String(parsedGeom.type)} valid (verifikasi struktur BFF/lokal; FastAPI GIS tidak aktif).`
            : "Objek GeoJSON harus memiliki field 'type' dan array 'coordinates'.",
      });
    } finally {
      setValidatingGeom(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const lon = Number(createForm.longitude);
    const lat = Number(createForm.latitude);
    const year = Number(createForm.acquisitionYear);
    const valueIdr = Number(createForm.assetValueIdr);

    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      showToast({
        variant: "error",
        title: "Koordinat tidak valid",
        description: "Masukkan nilai longitude & latitude EPSG:4326 yang benar.",
      });
      return;
    }
    if (!Number.isInteger(valueIdr) || valueIdr < 0) {
      showToast({
        variant: "error",
        title: "Nilai aset harus bilangan bulat Rupiah",
        description: "Gunakan angka integer positif tanpa desimal.",
      });
      return;
    }

    const geometry =
      createForm.geometryType === "Point"
        ? { type: "Point", coordinates: [lon, lat] }
        : createForm.geometryType === "LineString"
          ? {
              type: "LineString",
              coordinates: [
                [lon - 0.00015, lat],
                [lon + 0.00015, lat],
              ],
            }
          : {
              type: "Polygon",
              coordinates: [
                [
                  [lon - 0.00012, lat - 0.0001],
                  [lon + 0.00012, lat - 0.0001],
                  [lon + 0.00012, lat + 0.0001],
                  [lon - 0.00012, lat + 0.0001],
                  [lon - 0.00012, lat - 0.0001],
                ],
              ],
            };

    setCreating(true);
    try {
      const res = await bffApi.createSpatialAsset({
        assetCode: createForm.assetCode.trim().toUpperCase(),
        name: createForm.name.trim(),
        layerType: createForm.layerType,
        category: createForm.category.trim(),
        subCategory: createForm.subCategory.trim(),
        longitude: lon,
        latitude: lat,
        geometry,
        condition: createForm.condition,
        acquisitionYear: year,
        assetValueIdr: valueIdr,
        picName: createForm.picName.trim(),
        picContact: createForm.picContact.trim(),
        photoUrl: createForm.photoUrl.trim(),
        photoCaption: createForm.photoCaption.trim(),
        operationalStatus: createForm.operationalStatus,
        notes: createForm.notes.trim(),
      });

      showToast({
        variant: "success",
        title: "Aset spasial tersimpan",
        description: `${res.data?.assetCode} otomatis diproyeksikan ke EPSG:32748 (UTM 48S).`,
      });
      setCreateOpen(false);
      setCreateForm((prev) => ({
        ...prev,
        assetCode: "",
        name: "",
        subCategory: "",
        picName: "",
        picContact: "",
        photoUrl: "",
        photoCaption: "",
        notes: "",
      }));
      await loadSpatialWorkspace();
      if (res.data) {
        setSelectedAsset(res.data);
      }
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal menyimpan aset spasial",
        description:
          err instanceof BffClientError ? err.message : "Periksa data formulir.",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const cost = Number(inspectForm.maintenanceCostIdr) || 0;

    setUpdatingAsset(true);
    try {
      const res = await bffApi.updateSpatialAsset(selectedAsset.assetId, {
        condition: inspectForm.conditionAfter,
        operationalStatus: inspectForm.operationalStatus,
        inspectionEntry: {
          conditionAfter: inspectForm.conditionAfter,
          notes: inspectForm.notes.trim(),
          maintenanceCostIdr: cost,
        },
      });
      showToast({
        variant: "success",
        title: "Riwayat inspeksi & kondisi diperbarui",
        description: `Aset ${selectedAsset.assetCode} diperbarui.`,
      });
      setInspectOpen(false);
      setInspectForm({
        conditionAfter: "GOOD",
        operationalStatus: "ACTIVE",
        maintenanceCostIdr: "0",
        notes: "",
      });
      await loadSpatialWorkspace();
      if (res.data) {
        setSelectedAsset(res.data);
      }
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal mencatat inspeksi aset",
        description:
          err instanceof BffClientError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setUpdatingAsset(false);
    }
  };

  const assetColumns: ColumnDef<SpatialAssetRecord>[] = [
    {
      key: "identity",
      header: "Identitas Aset",
      render: (row) => (
        <div>
          <p className="font-semibold text-[#1F2933]">{row.name}</p>
          <p className="font-mono text-xs text-[#667085]">{row.assetCode}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Layer & Kategori",
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-[#1F2933]">{row.category}</p>
          <p className="text-xs text-[#667085]">{row.layerType}</p>
        </div>
      ),
    },
    {
      key: "coords",
      header: "Koordinat (4326 / 32748)",
      render: (row) => (
        <div className="font-mono text-xs text-[#667085] tabular-nums">
          <p>
            {row.coordinates.longitude.toFixed(5)}, {row.coordinates.latitude.toFixed(5)}
          </p>
          <p>
            UTM 48S: {row.coordinates.utmEasting ?? "—"}E,{" "}
            {row.coordinates.utmNorthing ?? "—"}N
          </p>
        </div>
      ),
    },
    {
      key: "condition",
      header: "Kondisi & Status",
      render: (row) => {
        const meta = getConditionStatusMeta(row.condition);
        return (
          <div className="space-y-0.5">
            <StatusText label={meta.label} tone={meta.tone} />
            <p className="text-[11px] text-[#667085]">
              Operasional: {row.operationalStatus}
            </p>
          </div>
        );
      },
    },
    {
      key: "value",
      header: "Nilai Aset",
      align: "right",
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-[#1F2933] tabular-nums">
          {formatIdr(row.assetValueIdr)}
        </span>
      ),
    },
    {
      key: "action",
      header: "Aksi",
      align: "right",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          iconLeft={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={() => setSelectedAsset(row)}
        >
          Detail 12 Atribut
        </Button>
      ),
    },
  ];

  const totalAssetValue = assets.reduce((acc, a) => acc + (a.assetValueIdr || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1F2933]">
            Peta Wilayah &amp; Manajemen Aset Spasial
          </h2>
          <p className="text-sm text-[#667085]">
            Integrasi GIS BFF (EPSG:4326 &amp; metrik UTM Zone 48S EPSG:32748) untuk RT 06 RW 01.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#E4E7EC] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                viewMode === "map"
                  ? "bg-[#1F5E4A] text-white"
                  : "text-[#667085] hover:text-[#1F2933]"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Peta Interaktif</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                viewMode === "table"
                  ? "bg-[#1F5E4A] text-white"
                  : "text-[#667085] hover:text-[#1F2933]"
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tabel Aset (Aksesibel)</span>
            </button>
          </div>

          {canWrite && (
            <>
              <Button
                variant="outline"
                iconLeft={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                onClick={() => {
                  setValidationResult(null);
                  setValidatorOpen(true);
                }}
              >
                Validasi Geometri
              </Button>
              <Button
                iconLeft={<Plus className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setCreateOpen(true)}
              >
                Tambah Aset Spasial
              </Button>
            </>
          )}
        </div>
      </div>

      {/* GIS BFF Connection & Summary Strip */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E4E7EC] bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <StatusText
            label={
              gisServiceOnline
                ? "Terhubung ke FastAPI GIS / PostGIS via BFF"
                : "Mode Baseline Geospasial RT 06 + Repositori Aset Firestore"
            }
            tone={gisServiceOnline ? "success" : "info"}
          />
          <span className="text-[#667085]">
            Aset Terinventaris: <strong className="text-[#1F2933]">{assets.length}</strong>
          </span>
          <span className="text-[#667085]">
            Total Nilai Aset:{" "}
            <strong className="font-mono text-[#1F2933] tabular-nums">
              {formatIdr(totalAssetValue)}
            </strong>
          </span>
        </div>

        {/* Search & Condition Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#667085]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode/nama aset, lokasi..."
              aria-label="Cari aset atau fitur spasial"
              className="rounded-lg border border-[#E4E7EC] bg-white py-1.5 pr-3 pl-8 text-xs text-[#1F2933] focus:border-[#1F5E4A] focus:outline-none"
            />
          </div>
          <select
            aria-label="Filter kondisi aset"
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-1.5 text-xs text-[#1F2933]"
          >
            <option value="ALL">Semua Kondisi</option>
            <option value="GOOD">Baik</option>
            <option value="FAIR">Cukup</option>
            <option value="POOR">Rusak Ringan</option>
            <option value="CRITICAL">Kritis</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadSpatialWorkspace()} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Map or Accessible Table + Spatial Query */}
          <div className="space-y-5 lg:col-span-8">
            {viewMode === "map" ? (
              <InteractiveGisMap
                features={allMapFeatures}
                activeLayers={activeLayers}
                selectedId={selectedFeature?.id || null}
                onSelectFeature={handleSelectFeature}
                pickMode={pickMode}
                queryCenter={validQueryCoords ? [parsedQueryLon, parsedQueryLat] : null}
                queryRadiusMeters={Number(queryRadius) || 100}
                onPickCoordinate={(lon, lat) => {
                  setQueryLon(String(lon));
                  setQueryLat(String(lat));
                  setCreateForm((prev) => ({
                    ...prev,
                    longitude: String(lon),
                    latitude: String(lat),
                  }));
                  setPickMode(false);
                  showToast({
                    variant: "info",
                    title: "Koordinat terpilih dari peta",
                    description: `Lon ${lon}, Lat ${lat} (EPSG:4326)`,
                  });
                }}
              />
            ) : (
              <DataTable
                data={filteredAssets}
                columns={assetColumns}
                keyExtractor={(r) => r.assetId}
                searchPlaceholder="Cari kode aset, nama, atau penanggung jawab..."
                searchFilter={(row, q) =>
                  row.assetCode.toLowerCase().includes(q) ||
                  row.name.toLowerCase().includes(q) ||
                  row.picName.toLowerCase().includes(q)
                }
                emptyTitle="Belum Ada Aset Spasial Terdaftar"
                emptyDescription="Tambahkan aset prasarana lingkungan seperti pos kamling, lampu PJU, saluran drainase, atau balai warga."
                emptyActionLabel={canWrite ? "Tambah Aset Pertama" : undefined}
                onEmptyAction={canWrite ? () => setCreateOpen(true) : undefined}
              />
            )}

            {/* Spatial Query Panel (Buffer Analysis) */}
            <section className="rounded-xl border border-[#E4E7EC] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E7EC] pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-[#1F5E4A]" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-[#1F2933]">
                    Query Spasial &amp; Analisis Radius Buffer (EPSG:4326 → UTM 48S)
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant={pickMode ? "secondary" : "outline"}
                  iconLeft={<Crosshair className="h-3.5 w-3.5" aria-hidden="true" />}
                  onClick={() => setPickMode((p) => !p)}
                >
                  {pickMode ? "Mode Pilih Aktif (Klik Peta)" : "Ambil Titik dari Peta"}
                </Button>
              </div>

              <form onSubmit={handleRunSpatialQuery} className="mt-4 grid gap-3 sm:grid-cols-4">
                <FormField id="q-layer" label="Layer Target">
                  <SelectInput
                    id="q-layer"
                    value={queryLayer}
                    onChange={(e) => setQueryLayer(e.target.value as SpatialLayerType)}
                  >
                    {SPATIAL_LAYERS.map((l) => (
                      <option key={l.key} value={l.key}>
                        {l.shortLabel}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                <FormField id="q-lon" label="Longitude">
                  <TextInput
                    id="q-lon"
                    value={queryLon}
                    onChange={(e) => setQueryLon(e.target.value)}
                  />
                </FormField>

                <FormField id="q-lat" label="Latitude">
                  <TextInput
                    id="q-lat"
                    value={queryLat}
                    onChange={(e) => setQueryLat(e.target.value)}
                  />
                </FormField>

                <FormField id="q-radius" label="Radius (meter)">
                  <TextInput
                    id="q-radius"
                    type="number"
                    min={5}
                    max={1000}
                    value={queryRadius}
                    onChange={(e) => setQueryRadius(e.target.value)}
                  />
                </FormField>

                <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-4">
                  <p className="font-mono text-xs text-[#667085] tabular-nums">
                    {queryUtmPreview
                      ? `Proyeksi Metrik UTM Zone 48S (EPSG:32748): ${queryUtmPreview.easting} mE, ${queryUtmPreview.northing} mN`
                      : "Masukkan koordinat valid"}
                  </p>
                  <Button type="submit" size="sm" loading={runningQuery}>
                    Jalankan Query Spasial
                  </Button>
                </div>
              </form>

              {queryResult && (
                <div className="mt-4 rounded-lg border border-[#E4E7EC] bg-[#F7F8F6] p-3.5 text-xs">
                  <p className="font-semibold text-[#1F2933]">
                    Hasil Pencarian Buffer ({queryResult.matchedCount} objek dalam radius{" "}
                    {queryRadius} m)
                  </p>
                  <p className="mt-0.5 text-[#667085]">{queryResult.message}</p>
                  {queryResult.matchedAssets.length > 0 && (
                    <ul className="mt-2 divide-y divide-[#E4E7EC] rounded-md border border-[#E4E7EC] bg-white px-3">
                      {queryResult.matchedAssets.map((m) => (
                        <li
                          key={m.assetCode}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="font-medium text-[#1F2933]">
                            {m.assetCode} — {m.name}
                          </span>
                          <span className="font-mono text-[#1F5E4A] tabular-nums">
                            {m.distanceMeters} m
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Layer Control + 12-Attribute Inspector */}
          <div className="space-y-5 lg:col-span-4">
            {/* Layer Filter & Legend */}
            <section className="rounded-xl border border-[#E4E7EC] bg-white p-5">
              <div className="flex items-center gap-2 border-b border-[#E4E7EC] pb-3">
                <Layers className="h-4 w-4 text-[#1F5E4A]" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-[#1F2933]">
                  Kontrol Layer Spasial (6 Layer)
                </h3>
              </div>

              <div className="mt-3 space-y-2">
                {SPATIAL_LAYERS.map((layer) => (
                  <label
                    key={layer.key}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-[#E4E7EC] px-3 py-2 text-xs hover:bg-[#F7F8F6]"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={activeLayers[layer.key]}
                        onChange={(e) =>
                          setActiveLayers((prev) => ({
                            ...prev,
                            [layer.key]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded accent-[#1F5E4A]"
                      />
                      <span
                        className="inline-block h-3 w-3 rounded-xs border"
                        style={{
                          backgroundColor: layer.fill === "none" ? layer.stroke : layer.fill,
                          borderColor: layer.stroke,
                        }}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-[#1F2933]">{layer.label}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#667085]">
                      {layer.geometryHint}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* 12-Attribute Asset Inspector or Selected Feature Card */}
            <section className="rounded-xl border border-[#E4E7EC] bg-white p-5">
              <div className="flex items-center justify-between gap-2 border-b border-[#E4E7EC] pb-3">
                <h3 className="text-sm font-semibold text-[#1F2933]">
                  Atribut Objek &amp; Aset (12 Parameter)
                </h3>
                {selectedAsset && canWrite && (
                  <Button
                    size="sm"
                    variant="outline"
                    iconLeft={<Wrench className="h-3.5 w-3.5" aria-hidden="true" />}
                    onClick={() => {
                      setInspectForm({
                        conditionAfter: selectedAsset.condition,
                        operationalStatus: selectedAsset.operationalStatus,
                        maintenanceCostIdr: "0",
                        notes: "",
                      });
                      setInspectOpen(true);
                    }}
                  >
                    Catat Inspeksi
                  </Button>
                )}
              </div>

              {selectedAsset ? (
                <div className="mt-4 space-y-4 text-xs">
                  {/* Photo Documentation */}
                  {selectedAsset.photoUrl ? (
                    <div className="overflow-hidden rounded-lg border border-[#E4E7EC] bg-[#F7F8F6]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedAsset.photoUrl}
                        alt={selectedAsset.photoCaption || selectedAsset.name}
                        className="h-36 w-full object-cover"
                      />
                      {selectedAsset.photoCaption && (
                        <p className="px-3 py-1.5 text-[11px] text-[#667085]">
                          {selectedAsset.photoCaption}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#E4E7EC] bg-[#F7F8F6] px-3 py-3 text-[#667085]">
                      <ImageIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Belum ada foto dokumentasi lapangan untuk aset ini.</span>
                    </div>
                  )}

                  {/* Core 12 Attributes Grid */}
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-[#667085]">1. Identitas Aset</dt>
                      <dd className="mt-0.5 font-semibold text-[#1F2933]">
                        {selectedAsset.assetCode} — {selectedAsset.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#667085]">2. Kategori &amp; Layer</dt>
                      <dd className="mt-0.5 font-medium text-[#1F2933]">
                        {selectedAsset.category} ({selectedAsset.layerType})
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[#667085]">
                        3. Koordinat (EPSG:4326 &amp; EPSG:32748)
                      </dt>
                      <dd className="mt-0.5 font-mono text-[#1F2933] tabular-nums">
                        {selectedAsset.coordinates.longitude.toFixed(6)},{" "}
                        {selectedAsset.coordinates.latitude.toFixed(6)} · UTM 48S:{" "}
                        {selectedAsset.coordinates.utmEasting}E,{" "}
                        {selectedAsset.coordinates.utmNorthing}N
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#667085]">4. Geometri Spasial</dt>
                      <dd className="mt-0.5 font-mono text-[#1F2933]">
                        GeoJSON {selectedAsset.geometry?.type || "Point"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#667085]">5. Kondisi Aset</dt>
                      <dd className="mt-0.5">
                        <StatusText
                          label={getConditionStatusMeta(selectedAsset.condition).label}
                          tone={getConditionStatusMeta(selectedAsset.condition).tone}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#667085]">6. Tahun Pengadaan</dt>
                      <dd className="mt-0.5 font-mono text-[#1F2933] tabular-nums">
                        {selectedAsset.acquisitionYear}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#667085]">7. Nilai Aset</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-[#1F2933] tabular-nums">
                        {formatIdr(selectedAsset.assetValueIdr)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#667085]">8. Penanggung Jawab</dt>
                      <dd className="mt-0.5 font-medium text-[#1F2933]">
                        {selectedAsset.picName}
                        {selectedAsset.picContact ? ` (${selectedAsset.picContact})` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#667085]">11. Status Operasional</dt>
                      <dd className="mt-0.5 font-semibold text-[#1F5E4A]">
                        {selectedAsset.operationalStatus}
                      </dd>
                    </div>
                  </dl>

                  {/* 10. Riwayat Inspeksi */}
                  <div className="border-t border-[#E4E7EC] pt-3">
                    <p className="flex items-center gap-1.5 font-semibold text-[#1F2933]">
                      <ClipboardCheck className="h-3.5 w-3.5 text-[#1F5E4A]" aria-hidden="true" />
                      <span>10. Riwayat Inspeksi &amp; Pemeliharaan</span>
                    </p>
                    {selectedAsset.inspectionHistory?.length ? (
                      <ul className="mt-2 space-y-2">
                        {selectedAsset.inspectionHistory.slice(0, 4).map((ins) => (
                          <li
                            key={ins.inspectionId}
                            className="rounded-md border border-[#E4E7EC] bg-[#F7F8F6] p-2.5"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium text-[#1F2933]">
                                {ins.inspectorName}
                              </span>
                              <span className="text-[#667085]">
                                {formatDateTimeJakarta(ins.inspectedAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-[#667085]">{ins.notes}</p>
                            {ins.maintenanceCostIdr ? (
                              <p className="mt-0.5 font-mono text-[#1F5E4A] tabular-nums">
                                Biaya pemeliharaan: {formatIdr(ins.maintenanceCostIdr)}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[#667085]">Belum ada log inspeksi.</p>
                    )}
                  </div>

                  {/* 12. Riwayat Perubahan Data */}
                  <div className="border-t border-[#E4E7EC] pt-3">
                    <p className="flex items-center gap-1.5 font-semibold text-[#1F2933]">
                      <History className="h-3.5 w-3.5 text-[#1F5E4A]" aria-hidden="true" />
                      <span>12. Riwayat Perubahan Data</span>
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {(selectedAsset.changeHistory || []).slice(0, 4).map((chg, i) => (
                        <li key={i} className="text-[#667085]">
                          <span className="font-medium text-[#1F2933]">{chg.summary}</span> ·{" "}
                          {formatDateTimeJakarta(chg.changedAt)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : selectedFeature ? (
                <div className="mt-4 space-y-2 text-xs">
                  <p className="font-semibold text-[#1F2933]">{selectedFeature.label}</p>
                  <p className="text-[#667085]">
                    Layer: {selectedFeature.layer} · Geometri:{" "}
                    {selectedFeature.feature.geometry?.type}
                  </p>
                  <pre className="max-h-48 overflow-auto rounded-lg border border-[#E4E7EC] bg-[#F7F8F6] p-3 font-mono text-[11px] text-[#1F2933]">
                    {JSON.stringify(selectedFeature.feature.properties, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-[#667085]">
                  Klik objek pada peta atau pilih &ldquo;Detail 12 Atribut&rdquo; pada daftar
                  aset untuk memeriksa informasi spasial lengkap.
                </div>
              )}

              {/* Quick clickable list of persisted assets */}
              {assets.length > 0 && (
                <div className="mt-4 border-t border-[#E4E7EC] pt-3">
                  <p className="mb-2 text-xs font-semibold text-[#667085]">
                    Daftar Cepat Aset Terdaftar ({filteredAssets.length})
                  </p>
                  <div className="max-h-44 space-y-1.5 overflow-y-auto">
                    {filteredAssets.map((a) => (
                      <button
                        key={a.assetId}
                        type="button"
                        onClick={() => setSelectedAsset(a)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                          selectedAsset?.assetId === a.assetId
                            ? "border-[#1F5E4A] bg-[#EFF2EE]"
                            : "border-[#E4E7EC] hover:bg-[#F7F8F6]"
                        }`}
                      >
                        <span className="truncate font-medium text-[#1F2933]">
                          {a.assetCode} · {a.name}
                        </span>
                        <span className="ml-2 shrink-0 font-mono text-[11px] text-[#667085]">
                          {a.condition}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Modal: Geometry Validator */}
      <Modal
        open={validatorOpen}
        onClose={() => setValidatorOpen(false)}
        title="Validasi Topologi & SRID Geometri"
        description="Memeriksa validitas struktur GeoJSON dan proyeksi koordinat melalui GIS BFF."
      >
        <form onSubmit={handleValidateGeometry} className="space-y-4">
          <FormField id="val-srid" label="Target SRID">
            <SelectInput
              id="val-srid"
              value={expectedSrid}
              onChange={(e) => setExpectedSrid(e.target.value)}
            >
              <option value="4326">EPSG:4326 (WGS 84 Geografis)</option>
              <option value="32748">EPSG:32748 (WGS 84 / UTM Zone 48S)</option>
            </SelectInput>
          </FormField>
          <FormField id="val-geom" label="Objek GeoJSON Geometry" required>
            <TextareaInput
              id="val-geom"
              className="font-mono text-xs"
              rows={6}
              value={geometryJson}
              onChange={(e) => setGeometryJson(e.target.value)}
            />
          </FormField>
          {validationResult && (
            <div
              className={`rounded-lg border p-3 text-xs ${
                validationResult.isValid
                  ? "border-[#217A45]/30 bg-[#EFF2EE] text-[#1F2933]"
                  : "border-[#B42318]/30 bg-[#FEF3F2] text-[#B42318]"
              }`}
            >
              <p className="font-semibold">
                {validationResult.isValid ? "Geometri Valid" : "Geometri Tidak Valid"} (EPSG:
                {validationResult.srid})
              </p>
              <p className="mt-0.5">{validationResult.message}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-[#E4E7EC] pt-4">
            <Button variant="outline" onClick={() => setValidatorOpen(false)}>
              Tutup
            </Button>
            <Button type="submit" loading={validatingGeom}>
              Validasi Sekarang
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create 12-Attribute Spatial Asset */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tambah Aset Spasial RT 06 RW 01"
        description="Seluruh 12 atribut wajib aset infrastruktur & lingkungan tercatat terstruktur."
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleCreateAsset} className="grid gap-4 sm:grid-cols-2">
          <FormField id="ast-code" label="1a. Kode Identitas Aset" required>
            <TextInput
              id="ast-code"
              required
              placeholder="Contoh: AST-PJU-09"
              value={createForm.assetCode}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, assetCode: e.target.value }))
              }
            />
          </FormField>

          <FormField id="ast-name" label="1b. Nama Aset" required>
            <TextInput
              id="ast-name"
              required
              placeholder="Tiang PJU Jalan Utama Blok B"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, name: e.target.value }))
              }
            />
          </FormField>

          <FormField id="ast-layer" label="2a. Layer Spasial" required>
            <SelectInput
              id="ast-layer"
              value={createForm.layerType}
              onChange={(e) =>
                setCreateForm((p) => ({
                  ...p,
                  layerType: e.target.value as SpatialLayerType,
                }))
              }
            >
              {SPATIAL_LAYERS.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField id="ast-cat" label="2b. Kategori Aset" required>
            <TextInput
              id="ast-cat"
              required
              value={createForm.category}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, category: e.target.value }))
              }
            />
          </FormField>

          <FormField id="ast-lon" label="3a. Longitude (EPSG:4326)" required>
            <TextInput
              id="ast-lon"
              required
              value={createForm.longitude}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, longitude: e.target.value }))
              }
            />
          </FormField>

          <FormField id="ast-lat" label="3b. Latitude (EPSG:4326)" required>
            <TextInput
              id="ast-lat"
              required
              value={createForm.latitude}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, latitude: e.target.value }))
              }
            />
          </FormField>

          <div className="rounded-lg bg-[#F7F8F6] px-3 py-2 font-mono text-xs text-[#667085] sm:col-span-2">
            {createUtmPreview
              ? `Konversi otomatis EPSG:32748 (UTM Zone 48S): ${createUtmPreview.easting} mE, ${createUtmPreview.northing} mN`
              : "Koordinat belum valid"}
          </div>

          <FormField id="ast-geom" label="4. Tipe Geometri Spasial" required>
            <SelectInput
              id="ast-geom"
              value={createForm.geometryType}
              onChange={(e) =>
                setCreateForm((p) => ({
                  ...p,
                  geometryType: e.target.value as "Point" | "LineString" | "Polygon",
                }))
              }
            >
              <option value="Point">Point (Titik Lokasi)</option>
              <option value="LineString">LineString (Jaringan/Saluran)</option>
              <option value="Polygon">Polygon (Area/Persil)</option>
            </SelectInput>
          </FormField>

          <FormField id="ast-cond" label="5. Kondisi Aset" required>
            <SelectInput
              id="ast-cond"
              value={createForm.condition}
              onChange={(e) =>
                setCreateForm((p) => ({
                  ...p,
                  condition: e.target.value as AssetCondition,
                }))
              }
            >
              <option value="GOOD">Baik (GOOD)</option>
              <option value="FAIR">Cukup (FAIR)</option>
              <option value="POOR">Rusak Ringan (POOR)</option>
              <option value="CRITICAL">Kritis (CRITICAL)</option>
            </SelectInput>
          </FormField>

          <FormField id="ast-year" label="6. Tahun Pengadaan" required>
            <TextInput
              id="ast-year"
              type="number"
              min={1980}
              max={2035}
              required
              value={createForm.acquisitionYear}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, acquisitionYear: e.target.value }))
              }
            />
          </FormField>

          <FormField id="ast-val" label="7. Nilai Aset (Integer IDR)" required>
            <TextInput
              id="ast-val"
              type="number"
              min={0}
              step={1}
              required
              value={createForm.assetValueIdr}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, assetValueIdr: e.target.value }))
              }
            />
          </FormField>

          <FormField id="ast-pic" label="8a. Penanggung Jawab (PIC)" required>
            <TextInput
              id="ast-pic"
              required
              placeholder="Seksi Sarpras RT 06"
              value={createForm.picName}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, picName: e.target.value }))
              }
            />
          </FormField>

          <FormField id="ast-pic-contact" label="8b. Kontak PIC">
            <TextInput
              id="ast-pic-contact"
              placeholder="08xx / email pengurus"
              value={createForm.picContact}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, picContact: e.target.value }))
              }
            />
          </FormField>

          <FormField id="ast-photo" label="9. URL Foto Dokumentasi">
            <TextInput
              id="ast-photo"
              placeholder="https://..."
              value={createForm.photoUrl}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, photoUrl: e.target.value }))
              }
            />
          </FormField>

          <FormField id="ast-status" label="11. Status Operasional" required>
            <SelectInput
              id="ast-status"
              value={createForm.operationalStatus}
              onChange={(e) =>
                setCreateForm((p) => ({
                  ...p,
                  operationalStatus: e.target.value as OperationalStatus,
                }))
              }
            >
              <option value="ACTIVE">ACTIVE (Beroperasi)</option>
              <option value="MAINTENANCE">MAINTENANCE (Perbaikan)</option>
              <option value="DECOMMISSIONED">DECOMMISSIONED (Nonaktif)</option>
            </SelectInput>
          </FormField>

          <div className="sm:col-span-2">
            <FormField id="ast-notes" label="Catatan Tambahan & Riwayat Awal">
              <TextareaInput
                id="ast-notes"
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#E4E7EC] pt-4 sm:col-span-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={creating}>
              Simpan Aset Spasial
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Inspection & Maintenance */}
      <Modal
        open={inspectOpen && Boolean(selectedAsset)}
        onClose={() => setInspectOpen(false)}
        title={`Catat Inspeksi: ${selectedAsset?.assetCode || ""}`}
        description="Menambah riwayat inspeksi, memperbarui kondisi aset, dan mencatat biaya pemeliharaan."
      >
        <form onSubmit={handleSubmitInspection} className="space-y-4">
          <FormField id="ins-cond" label="Kondisi Setelah Inspeksi" required>
            <SelectInput
              id="ins-cond"
              value={inspectForm.conditionAfter}
              onChange={(e) =>
                setInspectForm((p) => ({
                  ...p,
                  conditionAfter: e.target.value as AssetCondition,
                }))
              }
            >
              <option value="GOOD">Baik (GOOD)</option>
              <option value="FAIR">Cukup (FAIR)</option>
              <option value="POOR">Rusak Ringan (POOR)</option>
              <option value="CRITICAL">Kritis (CRITICAL)</option>
            </SelectInput>
          </FormField>
          <FormField id="ins-op" label="Status Operasional" required>
            <SelectInput
              id="ins-op"
              value={inspectForm.operationalStatus}
              onChange={(e) =>
                setInspectForm((p) => ({
                  ...p,
                  operationalStatus: e.target.value as OperationalStatus,
                }))
              }
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="DECOMMISSIONED">DECOMMISSIONED</option>
            </SelectInput>
          </FormField>
          <FormField id="ins-cost" label="Biaya Pemeliharaan (Integer IDR)">
            <TextInput
              id="ins-cost"
              type="number"
              min={0}
              step={1}
              value={inspectForm.maintenanceCostIdr}
              onChange={(e) =>
                setInspectForm((p) => ({
                  ...p,
                  maintenanceCostIdr: e.target.value,
                }))
              }
            />
          </FormField>
          <FormField id="ins-notes" label="Catatan Temuan & Tindakan" required>
            <TextareaInput
              id="ins-notes"
              required
              placeholder="Contoh: Penggantian lampu LED dan pembersihan panel surya."
              value={inspectForm.notes}
              onChange={(e) =>
                setInspectForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
          </FormField>
          <div className="flex justify-end gap-2 border-t border-[#E4E7EC] pt-4">
            <Button variant="outline" onClick={() => setInspectOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={updatingAsset}>
              Simpan Log Inspeksi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
