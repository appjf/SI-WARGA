"use client";

import React, { useMemo, useRef, useState } from "react";
import { Compass, Crosshair, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { SPATIAL_LAYERS } from "./gis-baseline";
import type { GeoJsonFeature, SpatialLayerType } from "@/types";

export interface MapFeatureItem {
  id: string;
  layer: SpatialLayerType;
  feature: GeoJsonFeature;
  label: string;
  subtitle?: string;
  assetId?: string;
}

interface InteractiveGisMapProps {
  features: MapFeatureItem[];
  activeLayers: Record<SpatialLayerType, boolean>;
  selectedId: string | null;
  onSelectFeature: (item: MapFeatureItem) => void;
  pickMode: boolean;
  queryCenter: [number, number] | null;
  queryRadiusMeters: number;
  onPickCoordinate: (lon: number, lat: number) => void;
}

const VIEW_WIDTH = 900;
const VIEW_HEIGHT = 560;

// Default bounds around Perum Green Garden Residence RT 06 RW 01
const BASE_BOUNDS = {
  minLon: 107.9006,
  maxLon: 107.9038,
  minLat: -7.2179,
  maxLat: -7.2151,
};

function getLayerMeta(layer: SpatialLayerType) {
  return (
    SPATIAL_LAYERS.find((l) => l.key === layer) || {
      key: layer,
      label: layer,
      shortLabel: layer,
      stroke: "#1F5E4A",
      fill: "rgba(31,94,74,0.15)",
      geometryHint: "Point",
    }
  );
}

export function InteractiveGisMap({
  features,
  activeLayers,
  selectedId,
  onSelectFeature,
  pickMode,
  queryCenter,
  queryRadiusMeters,
  onPickCoordinate,
}: InteractiveGisMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [hoverCoord, setHoverCoord] = useState<[number, number] | null>(null);

  const project = useMemo(() => {
    const lonSpan = BASE_BOUNDS.maxLon - BASE_BOUNDS.minLon;
    const latSpan = BASE_BOUNDS.maxLat - BASE_BOUNDS.minLat;

    return {
      toSvg: (lon: number, lat: number): [number, number] => {
        const nx = (lon - BASE_BOUNDS.minLon) / lonSpan;
        const ny = 1 - (lat - BASE_BOUNDS.minLat) / latSpan;
        return [
          nx * VIEW_WIDTH * zoom + pan.x + (VIEW_WIDTH * (1 - zoom)) / 2,
          ny * VIEW_HEIGHT * zoom + pan.y + (VIEW_HEIGHT * (1 - zoom)) / 2,
        ];
      },
      toGeo: (svgX: number, svgY: number): [number, number] => {
        const ux = (svgX - pan.x - (VIEW_WIDTH * (1 - zoom)) / 2) / (VIEW_WIDTH * zoom);
        const uy = (svgY - pan.y - (VIEW_HEIGHT * (1 - zoom)) / 2) / (VIEW_HEIGHT * zoom);
        const lon = BASE_BOUNDS.minLon + ux * lonSpan;
        const lat = BASE_BOUNDS.minLat + (1 - uy) * latSpan;
        return [Math.round(lon * 1000000) / 1000000, Math.round(lat * 1000000) / 1000000];
      },
      metersToPixels: (meters: number): number => {
        // ~111,320 meters per degree latitude; approximate lon scaling at -7.2 deg
        const degSpanLat = BASE_BOUNDS.maxLat - BASE_BOUNDS.minLat;
        const metersAcrossHeight = degSpanLat * 111320;
        return (meters / metersAcrossHeight) * VIEW_HEIGHT * zoom;
      },
    };
  }, [zoom, pan]);

  const visibleFeatures = useMemo(
    () => features.filter((f) => activeLayers[f.layer]),
    [features, activeLayers]
  );

  const getSvgPointFromEvent = (e: React.MouseEvent<SVGSVGElement>): [number, number] | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = ((e.clientX - rect.left) / rect.width) * VIEW_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * VIEW_HEIGHT;
    return [x, y];
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (pickMode) {
      const pt = getSvgPointFromEvent(e);
      if (pt) {
        const [lon, lat] = project.toGeo(pt[0], pt[1]);
        onPickCoordinate(lon, lat);
      }
      return;
    }
    setDragging(true);
    dragOrigin.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getSvgPointFromEvent(e);
    if (pt) {
      setHoverCoord(project.toGeo(pt[0], pt[1]));
    }
    if (!dragging || !dragOrigin.current) return;
    const dx = e.clientX - dragOrigin.current.x;
    const dy = e.clientY - dragOrigin.current.y;
    setPan({ x: dragOrigin.current.panX + dx, y: dragOrigin.current.panY + dy });
  };

  const handleMouseUp = () => {
    setDragging(false);
    dragOrigin.current = null;
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const renderGeometry = (item: MapFeatureItem) => {
    const meta = getLayerMeta(item.layer);
    const isSelected = selectedId === item.id;
    const geom = item.feature.geometry;
    const coords = geom?.coordinates;

    if (!geom || !coords) return null;

    if (geom.type === "Point" && Array.isArray(coords) && coords.length >= 2) {
      const [lon, lat] = coords as [number, number];
      const [cx, cy] = project.toSvg(lon, lat);
      return (
        <g
          key={item.id}
          onClick={(e) => {
            if (pickMode) return;
            e.stopPropagation();
            onSelectFeature(item);
          }}
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label={`${item.label} (${meta.shortLabel})`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectFeature(item);
            }
          }}
        >
          {isSelected && (
            <circle
              cx={cx}
              cy={cy}
              r={14}
              fill="rgba(31, 94, 74, 0.18)"
              stroke="#1F5E4A"
              strokeWidth={1.5}
            />
          )}
          <circle
            cx={cx}
            cy={cy}
            r={isSelected ? 7.5 : 6}
            fill={meta.stroke}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
          <text
            x={cx + 10}
            y={cy + 3}
            className="pointer-events-none select-none fill-[#1F2933] text-[10px] font-medium"
          >
            {item.label.length > 26 ? `${item.label.slice(0, 24)}…` : item.label}
          </text>
        </g>
      );
    }

    if (geom.type === "LineString" && Array.isArray(coords)) {
      const points = (coords as Array<[number, number]>)
        .map((c) => project.toSvg(c[0], c[1]).join(","))
        .join(" ");
      return (
        <g
          key={item.id}
          onClick={(e) => {
            if (pickMode) return;
            e.stopPropagation();
            onSelectFeature(item);
          }}
          className="cursor-pointer"
        >
          <polyline
            points={points}
            fill="none"
            stroke={isSelected ? "#D9A441" : meta.stroke}
            strokeWidth={isSelected ? 6 : item.layer === "roads" ? 4.5 : 3}
            strokeDasharray={item.layer === "drainage" ? "6 4" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    if (geom.type === "MultiLineString" && Array.isArray(coords)) {
      return (
        <g
          key={item.id}
          onClick={(e) => {
            if (pickMode) return;
            e.stopPropagation();
            onSelectFeature(item);
          }}
          className="cursor-pointer"
        >
          {(coords as Array<Array<[number, number]>>).map((line, i) => (
            <polyline
              key={`${item.id}-${i}`}
              points={line.map((c) => project.toSvg(c[0], c[1]).join(",")).join(" ")}
              fill="none"
              stroke={isSelected ? "#D9A441" : meta.stroke}
              strokeWidth={isSelected ? 5 : 3}
              strokeLinecap="round"
            />
          ))}
        </g>
      );
    }

    if (geom.type === "Polygon" && Array.isArray(coords) && Array.isArray(coords[0])) {
      const ring = coords[0] as Array<[number, number]>;
      const pts = ring.map((c) => project.toSvg(c[0], c[1]).join(",")).join(" ");
      const centroid = ring.reduce(
        (acc, c) => [acc[0] + c[0] / ring.length, acc[1] + c[1] / ring.length],
        [0, 0]
      );
      const [lx, ly] = project.toSvg(centroid[0], centroid[1]);

      return (
        <g
          key={item.id}
          onClick={(e) => {
            if (pickMode) return;
            e.stopPropagation();
            onSelectFeature(item);
          }}
          className="cursor-pointer"
        >
          <polygon
            points={pts}
            fill={isSelected ? "rgba(217, 164, 65, 0.35)" : meta.fill}
            stroke={isSelected ? "#D9A441" : meta.stroke}
            strokeWidth={isSelected ? 2.5 : item.layer === "boundaries" ? 2 : 1.3}
            strokeDasharray={item.layer === "boundaries" ? "8 4" : undefined}
          />
          {item.layer !== "boundaries" && (
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              className="pointer-events-none select-none fill-[#1F2933] text-[9px] font-semibold"
            >
              {item.label.length > 18 ? `${item.label.slice(0, 16)}…` : item.label}
            </text>
          )}
        </g>
      );
    }

    return null;
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#E4E7EC] bg-[#F4F6F3]">
      {/* Map Overlay Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E7EC] bg-white px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-[#667085]">
          <Compass className="h-4 w-4 text-[#1F5E4A]" aria-hidden="true" />
          <span className="font-medium text-[#1F2933]">
            Peta Vektor RT 06 RW 01 · Green Garden Residence
          </span>
          <span className="hidden font-mono sm:inline">EPSG:4326</span>
        </div>

        <div className="flex items-center gap-1.5">
          {pickMode && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#A15C00]">
              <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
              Klik peta untuk memilih koordinat
            </span>
          )}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, Math.round((z + 0.25) * 100) / 100))}
            aria-label="Perbesar peta"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E4E7EC] bg-white text-[#1F2933] hover:bg-[#EFF2EE]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.75, Math.round((z - 0.25) * 100) / 100))}
            aria-label="Perkecil peta"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E4E7EC] bg-white text-[#1F2933] hover:bg-[#EFF2EE]"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset tampilan peta"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E4E7EC] bg-white px-2.5 text-xs font-medium text-[#1F2933] hover:bg-[#EFF2EE]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Interactive SVG Viewport */}
      <div className="relative h-[400px] w-full sm:h-[480px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className={`h-full w-full ${
            pickMode
              ? "cursor-crosshair"
              : dragging
                ? "cursor-grabbing"
                : "cursor-grab"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          role="img"
          aria-label="Peta interaktif RT 06 RW 01 Green Garden Residence"
        >
          {/* Coordinate Grid Lines */}
          <defs>
            <pattern
              id="gis-grid"
              width="45"
              height="45"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 45 0 L 0 0 0 45"
                fill="none"
                stroke="#E4E7EC"
                strokeWidth="0.8"
              />
            </pattern>
          </defs>
          <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#gis-grid)" />

          {/* Spatial Query Buffer Circle */}
          {queryCenter && (() => {
            const [qx, qy] = project.toSvg(queryCenter[0], queryCenter[1]);
            const rPx = Math.max(10, project.metersToPixels(queryRadiusMeters));
            return (
              <g className="pointer-events-none">
                <circle
                  cx={qx}
                  cy={qy}
                  r={rPx}
                  fill="rgba(217, 164, 65, 0.14)"
                  stroke="#A15C00"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                />
                <circle cx={qx} cy={qy} r={4} fill="#A15C00" />
              </g>
            );
          })()}

          {/* Ordered Spatial Features: boundaries first, then polygons, lines, points */}
          {visibleFeatures
            .slice()
            .sort((a, b) => {
              const order: Record<SpatialLayerType, number> = {
                boundaries: 1,
                houses: 2,
                facilities: 3,
                roads: 4,
                drainage: 5,
                assets: 6,
              };
              return order[a.layer] - order[b.layer];
            })
            .map((item) => renderGeometry(item))}
        </svg>

        {/* Bottom Coordinate & Zoom Readout */}
        <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#667085]">
          <div className="rounded-md border border-[#E4E7EC] bg-white/95 px-2.5 py-1 font-mono tabular-nums">
            {hoverCoord
              ? `Lon ${hoverCoord[0].toFixed(6)}, Lat ${hoverCoord[1].toFixed(6)}`
              : "Arahkan kursor ke peta untuk koordinat WGS84"}
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-[#E4E7EC] bg-white/95 px-2.5 py-1 font-mono tabular-nums">
            <Maximize2 className="h-3 w-3 text-[#1F5E4A]" aria-hidden="true" />
            <span>Zoom {Math.round(zoom * 100)}%</span>
            <span>·</span>
            <span>{visibleFeatures.length} objek tampil</span>
          </div>
        </div>
      </div>
    </div>
  );
}
