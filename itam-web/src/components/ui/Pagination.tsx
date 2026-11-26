"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export const PAGE_SIZES = [10, 25, 50, 75, 100];

type PageItem = number | "dots";

function pageWindow(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const left = Math.max(2, current - 2);
  const right = Math.min(total - 1, current + 2);
  const items: PageItem[] = [1];
  if (left > 2) items.push("dots");
  for (let i = left; i <= right; i++) items.push(i);
  if (right < total - 1) items.push("dots");
  items.push(total);
  return items;
}

export function usePagination<T>(items: T[], initialPageSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const paged = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);

  function setPageSize(size: number) {
    setPageSizeState(size);
    setPage(1);
  }

  return {
    page: currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    start,
    end,
    total,
    paged,
  };
}

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  start: number;
  end: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  start,
  end,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pages = pageWindow(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200/80 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Mostrando{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {total === 0 ? 0 : start + 1}–{end}
        </span>{" "}
        de <span className="font-semibold text-slate-700 dark:text-slate-200">{total.toLocaleString("es-PE")}</span>{" "}
        registros
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="page-size" className="text-xs text-slate-500 dark:text-slate-400">
          Filas:
        </label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <div className="inline-flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            title="Primera página"
            aria-label="Primera página"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            title="Página anterior"
            aria-label="Página anterior"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={15} />
          </button>

          {pages.map((item, index) =>
            item === "dots" ? (
              <span key={`dots-${index}`} className="px-1 text-xs text-slate-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors ${
                  item === page
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            title="Página siguiente"
            aria-label="Página siguiente"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            title="Última página"
            aria-label="Última página"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
