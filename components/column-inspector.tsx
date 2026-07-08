"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Sparkles, BarChart2, CheckCircle2, Hash, Layers } from "lucide-react"

// Match local and backend type declarations
interface ExtendedColumnInfo {
  name: string
  nonEmptyCount: number
  completeness: number
  likelyType?: "Name" | "Email" | "Phone" | "Company" | "City" | "Country" | "State"
  uniqueValuesCount?: number
  exampleValue?: string
}

interface ColumnInspectorProps {
  columns: ExtendedColumnInfo[]
  selectedColumn: string | null
  onSelectColumn: (colName: string | null) => void
}

export function ColumnInspector({
  columns,
  selectedColumn,
  onSelectColumn,
}: ColumnInspectorProps) {
  const selectedInfo = columns.find((c) => c.name === selectedColumn)

  return (
    <div className="flex flex-col gap-3 w-full text-left">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Column Inspector & Completeness
        </h4>
        <span className="text-[10px] text-muted-foreground font-semibold">
          Click a chip to inspect statistics and highlight column
        </span>
      </div>

      {/* Horizontal scroll chips */}
      <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-thin select-none max-w-full">
        {columns.map((col) => {
          const isSelected = selectedColumn === col.name
          const hasHeuristic = !!col.likelyType

          return (
            <button
              key={col.name}
              onClick={() => onSelectColumn(isSelected ? null : col.name)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 outline-hidden cursor-pointer",
                isSelected
                  ? "bg-primary/10 text-primary border-primary"
                  : "bg-white dark:bg-zinc-900 border-border dark:border-zinc-800 text-foreground hover:bg-muted dark:hover:bg-zinc-800"
              )}
            >
              <div className="flex flex-col text-left">
                <span className="truncate max-w-[120px] font-mono leading-tight">{col.name}</span>
                <span className="text-[9px] text-muted-foreground font-medium leading-none mt-0.5">
                  {col.completeness}% populated
                </span>
              </div>

              {hasHeuristic && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/20 text-[8px] text-primary border border-orange-100 dark:border-orange-900/30 font-bold shrink-0">
                  <Sparkles className="w-2.5 h-2.5 text-primary shrink-0 animate-pulse" />
                  <span>Likely {col.likelyType}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Expandable column details card if a chip is selected */}
      <AnimatePresence>
        {selectedInfo && (
          <div className="p-4 border border-border dark:border-zinc-800 bg-muted/20 dark:bg-zinc-900/20 rounded-xl flex flex-wrap gap-x-6 gap-y-3 items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary shrink-0" />
              <span className="font-bold text-foreground">Column Stats:</span>
              <span className="font-mono px-2 py-0.5 bg-white dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded font-bold text-primary">
                {selectedInfo.name}
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap text-muted-foreground font-medium">
              <div>
                Non-empty: <span className="font-bold text-foreground">{selectedInfo.completeness}%</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-border" />
              <div>
                Unique Values:{" "}
                <span className="font-bold text-foreground">
                  {selectedInfo.uniqueValuesCount?.toLocaleString() || "Calculated on upload"}
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-border" />
              <div>
                Detected Type:{" "}
                <span className="font-bold text-foreground">{selectedInfo.likelyType || "Text / String"}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-border" />
              <div className="truncate max-w-[200px]">
                Example: <span className="font-bold text-foreground italic">"{selectedInfo.exampleValue || "—"}"</span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Simple helper component mock wrapper
function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
