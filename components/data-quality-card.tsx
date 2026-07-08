"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CSVAnalysisResult } from "@/services/csvAnalyzer"

interface DataQualityCardProps {
  analysis: CSVAnalysisResult
}

export function DataQualityCard({ analysis }: DataQualityCardProps) {
  const {
    totalRows,
    emptyRowsCount,
    duplicateHeaders,
    rowsWithMissingValuesCount,
    warnings,
  } = analysis

  const hasIssues = warnings.length > 0

  return (
    <Card className="border-border dark:border-[#2E2E33] bg-white dark:bg-[#121214] shadow-xs rounded-xl text-left transition-colors duration-200">
      <CardHeader className="pb-3 border-b border-border dark:border-zinc-800">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          {hasIssues ? (
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          )}
          <span>File Quality Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 text-xs font-semibold">
        {/* KPI stats */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col p-2 bg-muted/40 dark:bg-zinc-900/40 rounded-lg border border-border/60 dark:border-zinc-850">
            <span className="text-[10px] text-muted-foreground uppercase">Empty Rows</span>
            <span className="text-sm font-bold text-foreground mt-0.5">{emptyRowsCount}</span>
          </div>

          <div className="flex flex-col p-2 bg-muted/40 dark:bg-zinc-900/40 rounded-lg border border-border/60 dark:border-zinc-850">
            <span className="text-[10px] text-muted-foreground uppercase">Duplicate Headers</span>
            <span className="text-sm font-bold text-foreground mt-0.5">{duplicateHeaders.length}</span>
          </div>

          <div className="col-span-2 flex flex-col p-2 bg-muted/40 dark:bg-zinc-900/40 rounded-lg border border-border/60 dark:border-zinc-850">
            <span className="text-[10px] text-muted-foreground uppercase">Rows with Missing Fields</span>
            <span className="text-sm font-bold text-foreground mt-0.5">
              {rowsWithMissingValuesCount} <span className="text-xs text-muted-foreground font-medium">({totalRows > 0 ? Math.round(rowsWithMissingValuesCount / totalRows * 100) : 0}% of rows)</span>
            </span>
          </div>
        </div>

        {/* Warnings Panel */}
        {hasIssues ? (
          <div className="flex flex-col gap-2 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 text-amber-600 dark:text-amber-500 text-xs">
            <span className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              Heuristic Quality Checks
            </span>
            <div className="flex flex-col gap-1.5 font-medium leading-relaxed">
              {warnings.map((warn, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="mt-1 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5 text-emerald-600 dark:text-emerald-500 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Excellent database format. Ready for direct CRM imports.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
