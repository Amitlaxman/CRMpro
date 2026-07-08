"use client"

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { cn } from "@/lib/utils"

interface PreviewTableProps {
  data: Record<string, string>[]
  headers: string[]
  selectedColumn: string | null
  searchTerm: string
}

export function PreviewTable({
  data,
  headers,
  selectedColumn,
  searchTerm,
}: PreviewTableProps) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: React.useCallback(() => 42, []),
    overscan: 8,
  })

  // Truncate cell text if it exceeds 100 characters and show simple title attribute for tooltip
  const renderCellContent = (value: string, isHighlighted: boolean) => {
    const stringVal = (value || "").toString()
    if (stringVal.trim() === "") {
      return <span className="text-muted-foreground/30 font-medium">—</span>
    }

    const truncated = stringVal.length > 100 ? `${stringVal.slice(0, 97)}...` : stringVal

    if (!searchTerm.trim()) {
      return <span title={stringVal}>{truncated}</span>
    }

    // Split and highlight search match
    const searchTrim = searchTerm.trim().toLowerCase()
    const parts = truncated.split(new RegExp(`(${searchTrim})`, "gi"))

    return (
      <span title={stringVal} className="break-all">
        {parts.map((part, i) =>
          part.toLowerCase() === searchTrim ? (
            <mark
              key={i}
              className="bg-orange-100 dark:bg-orange-500/30 text-orange-950 dark:text-orange-200 font-bold px-0.5 rounded-sm"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 w-full text-left">
      <div className="flex items-baseline justify-between text-xs font-bold text-muted-foreground">
        <span>GRID PREVIEW</span>
        <span>Showing {data.length.toLocaleString()} rows</span>
      </div>

      <div
        ref={parentRef}
        className="w-full border border-border dark:border-zinc-800 rounded-xl h-[380px] overflow-auto bg-white dark:bg-zinc-900/10 select-none relative scrollbar-thin"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {/* Table Element */}
          <table className="w-full text-xs text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-white dark:bg-[#121214] border-b border-border dark:border-zinc-800 z-20">
              <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider h-10">
                <th className="p-3 w-16 text-center border-r border-border dark:border-zinc-800 bg-white dark:bg-[#121214]">
                  Row
                </th>
                {headers.map((header) => {
                  const isSelected = selectedColumn === header
                  return (
                    <th
                      key={header}
                      className={cn(
                        "p-3 truncate font-mono bg-white dark:bg-[#121214] border-r border-border dark:border-zinc-800 last:border-r-0 min-w-[150px] transition-colors duration-150",
                        isSelected && "bg-primary/5 dark:bg-primary/10 text-primary border-x border-primary"
                      )}
                    >
                      {header}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = data[virtualRow.index]
                const isEven = virtualRow.index % 2 === 0
                return (
                  <tr
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className={cn(
                      "absolute w-full hover:bg-muted/30 dark:hover:bg-zinc-800/40 flex items-center border-b border-border/80 dark:border-zinc-850",
                      isEven ? "bg-white dark:bg-[#121214]" : "bg-muted/10 dark:bg-zinc-900/10"
                    )}
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                      height: "42px",
                    }}
                  >
                    <td className="p-3 w-16 text-center text-xs font-bold text-muted-foreground font-mono bg-muted/10 dark:bg-zinc-900/30 border-r border-border dark:border-zinc-800 self-stretch flex items-center justify-center shrink-0">
                      {virtualRow.index + 1}
                    </td>
                    {headers.map((header) => {
                      const isSelected = selectedColumn === header
                      return (
                        <td
                          key={header}
                          className={cn(
                            "p-3 truncate self-stretch flex items-center border-r border-border/80 dark:border-zinc-850 last:border-r-0 min-w-[150px] text-foreground dark:text-zinc-200 transition-colors duration-150 shrink-0",
                            isSelected && "bg-primary/5 dark:bg-primary/10 border-x border-primary/20"
                          )}
                        >
                          {renderCellContent(row[header], isSelected)}
                        </td>
                      )
                    })}
                  </tr>
                )}
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Bottom Fade indicator */}
      <div className="w-full h-2.5 bg-gradient-to-b from-transparent to-slate-50 dark:to-[#0B0B0C] pointer-events-none -mt-3.5 z-10" />
    </div>
  )
}
