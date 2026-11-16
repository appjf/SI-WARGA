"use client";

import React, { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState, LoadingSkeleton } from "./States";

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  toolbar?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  searchPlaceholder = "Cari data...",
  searchFilter,
  toolbar,
  emptyTitle = "Belum Ada Data",
  emptyDescription = "Data akan tampil di sini setelah ditambahkan.",
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim() || !searchFilter) return data;
    const q = search.trim().toLowerCase();
    return data.filter((row) => searchFilter(row, q));
  }, [data, search, searchFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-4">
      {(searchFilter || toolbar) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchFilter ? (
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#667085]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full rounded-lg border border-[#E4E7EC] bg-white py-2 pr-3 pl-9 text-sm text-[#1F2933] placeholder:text-[#667085]/70 focus:border-[#1F5E4A] focus:outline-none focus:ring-2 focus:ring-[#1F5E4A]/15"
              />
            </div>
          ) : (
            <div />
          )}
          {toolbar && (
            <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
          {/* Desktop High-Density Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E4E7EC] bg-[#F7F8F6]">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={`px-4 py-3 text-xs font-semibold tracking-wide text-[#667085] ${
                        col.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {paginated.map((row) => (
                  <tr
                    key={keyExtractor(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={
                      onRowClick
                        ? "cursor-pointer transition-colors hover:bg-[#F7F8F6]"
                        : "hover:bg-[#F7F8F6]/60"
                    }
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-[#1F2933] ${
                          col.align === "right" ? "text-right tabular-nums" : ""
                        }`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List Fallback */}
          <div className="divide-y divide-[#E4E7EC] md:hidden">
            {paginated.map((row) => (
              <div
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`space-y-2 p-4 ${
                  onRowClick ? "cursor-pointer active:bg-[#F7F8F6]" : ""
                }`}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <span className="text-xs font-medium text-[#667085]">
                      {col.header}
                    </span>
                    <div className="text-right text-[#1F2933]">
                      {col.render(row)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-[#E4E7EC] bg-[#F7F8F6] px-4 py-2.5 text-xs text-[#667085]">
            <span className="tabular-nums">
              Menampilkan {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filtered.length)} dari {filtered.length} entri
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Halaman sebelumnya"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E4E7EC] bg-white text-[#1F2933] hover:bg-[#EFF2EE] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="px-2 font-medium text-[#1F2933] tabular-nums">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Halaman berikutnya"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E4E7EC] bg-white text-[#1F2933] hover:bg-[#EFF2EE] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
