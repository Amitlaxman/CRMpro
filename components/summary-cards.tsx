"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Database, Layers, Clock } from "lucide-react"

interface SummaryCardsProps {
  fileName: string
  fileSize: number
  rowCount: number
  colCount: number
  timestamp: string
}

export function SummaryCards({
  fileName,
  fileSize,
  rowCount,
  colCount,
  timestamp,
}: SummaryCardsProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const items = [
    {
      label: "File Selected",
      val: fileName,
      desc: formatFileSize(fileSize),
      icon: FileText,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20",
    },
    {
      label: "Total Rows",
      val: rowCount.toLocaleString(),
      desc: "Lead records loaded",
      icon: Database,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
    },
    {
      label: "Columns Detected",
      val: `${colCount} Fields`,
      desc: "Headers parsed",
      icon: Layers,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      label: "Parsed Time",
      val: timestamp,
      desc: "Instant local load",
      icon: Clock,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
      {items.map((item, idx) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
          >
            <Card className="border-border dark:border-[#2E2E33] bg-white dark:bg-[#121214] shadow-xs rounded-xl hover:shadow-sm transition-all duration-200">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-foreground truncate mt-0.5 max-w-[140px] md:max-w-none">
                    {item.val}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {item.desc}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
