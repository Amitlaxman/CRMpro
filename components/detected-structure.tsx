"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, FileText, Mail, Phone, Calendar, Hash, HelpCircle } from "lucide-react"
import { ColumnInfo } from "@/services/csvAnalyzer"

interface DetectedStructureProps {
  columns: ColumnInfo[]
  sampleData: Record<string, string>[]
}

export function DetectedStructure({ columns, sampleData }: DetectedStructureProps) {
  // Infer likely data types (Text, Email, Phone, Number) based on header properties & values
  const inferType = (col: ColumnInfo): { label: string; icon: any } => {
    if (col.likelyType === "Email") return { label: "Email Address", icon: Mail }
    if (col.likelyType === "Phone") return { label: "Phone Number", icon: Phone }
    
    // Check sample values if we have them
    if (sampleData.length > 0) {
      const headerName = col.name
      const sampleVals = sampleData.slice(0, 5).map(r => (r[headerName] || "").trim())
      
      // Is numeric check
      const isNumeric = sampleVals.every(val => val === "" || !isNaN(Number(val.replace(/[^0-9.-]/g, ""))))
      if (isNumeric && sampleVals.some(val => val !== "")) {
        return { label: "Number / Value", icon: Hash }
      }
    }

    return { label: "Text / String", icon: FileText }
  }

  return (
    <Card className="border-border dark:border-[#2E2E33] bg-white dark:bg-[#121214] shadow-xs rounded-xl text-left transition-colors duration-200">
      <CardHeader className="pb-3 border-b border-border dark:border-zinc-800">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span>Detected CSV Structure</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
            CSV Schema structure detected locally. AI mapping will process these fields.
          </p>

          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {columns.map((col) => {
              const typeInfo = inferType(col)
              const Icon = typeInfo.icon
              const sampleVal = sampleData[0]?.[col.name] || ""

              return (
                <div
                  key={col.name}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 dark:border-zinc-850 bg-muted/20 dark:bg-zinc-900/20 text-xs"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-mono font-bold text-foreground truncate max-w-[150px]">
                      {col.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground truncate max-w-[150px]">
                      Sample: {sampleVal ? `"${sampleVal}"` : "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-border dark:border-zinc-800 text-[10px] font-bold text-muted-foreground shrink-0 shadow-2xs">
                    <Icon className="w-3 h-3 text-muted-foreground/80 shrink-0" />
                    <span>{typeInfo.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
