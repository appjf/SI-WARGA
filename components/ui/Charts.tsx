"use client";

import React from "react";

export interface BarDatum {
  label: string;
  primaryValue: number;
  secondaryValue?: number;
}

export function DualBarChart({
  data,
  primaryLabel,
  secondaryLabel,
  formatValue = (v) => v.toLocaleString("id-ID"),
}: {
  data: BarDatum[];
  primaryLabel: string;
  secondaryLabel?: string;
  formatValue?: (v: number) => string;
}) {
  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-[#667085]">
        Belum ada data periode untuk divisualisasikan.
      </p>
    );
  }

  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => [d.primaryValue, d.secondaryValue || 0])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#667085]">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-xs bg-[#1F5E4A]"
            aria-hidden="true"
          />
          <span>{primaryLabel}</span>
        </div>
        {secondaryLabel && (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-xs bg-[#D9A441]"
              aria-hidden="true"
            />
            <span>{secondaryLabel}</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {data.map((item) => {
          const pWidth = Math.max(2, Math.round((item.primaryValue / maxVal) * 100));
          const sWidth =
            item.secondaryValue !== undefined
              ? Math.max(2, Math.round((item.secondaryValue / maxVal) * 100))
              : 0;

          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#1F2933]">{item.label}</span>
                <span className="font-mono text-[#667085] tabular-nums">
                  {formatValue(item.primaryValue)}
                  {secondaryLabel && item.secondaryValue !== undefined
                    ? ` · ${formatValue(item.secondaryValue)}`
                    : ""}
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2.5 w-full overflow-hidden rounded-sm bg-[#EFF2EE]">
                  <div
                    className="h-full rounded-sm bg-[#1F5E4A] transition-all duration-300"
                    style={{ width: `${pWidth}%` }}
                  />
                </div>
                {secondaryLabel && item.secondaryValue !== undefined && (
                  <div className="h-2 w-full overflow-hidden rounded-sm bg-[#EFF2EE]">
                    <div
                      className="h-full rounded-sm bg-[#D9A441] transition-all duration-300"
                      style={{ width: `${sWidth}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BreakdownList({
  items,
}: {
  items: Array<{ label: string; count: number; color?: string }>;
}) {
  const total = items.reduce((acc, i) => acc + i.count, 0);
  if (total === 0) {
    return (
      <p className="py-6 text-center text-sm text-[#667085]">
        Belum ada data distribusi.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = Math.round((item.count / total) * 100);
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#1F2933]">{item.label}</span>
              <span className="font-mono text-[#667085] tabular-nums">
                {item.count} ({pct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-sm bg-[#EFF2EE]">
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: item.color || "#1F5E4A",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
