"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Loader2, Sparkles } from "lucide-react"

interface ProcessingViewProps {
  onComplete: () => void
}

const LOG_MESSAGES = [
  "Initializing AI Importer engine...",
  "✓ Parsed CSV structure successfully",
  "✓ Detected 18 database columns",
  "✓ AI matched header 'Full_Name' to Target Field 'Name' (99% confidence)",
  "✓ AI matched header 'email_addr' to Target Field 'Email' (97% confidence)",
  "✓ AI matched header 'ph_no' to Target Field 'Phone' (94% confidence)",
  "✓ AI matched header 'org_title' to Target Field 'Company' (91% confidence)",
  "✓ Starting record validation checks...",
  "✓ Flagged 3 rows with malformed email addresses",
  "✓ Flagged 14 rows with missing phone indicators",
  "✓ Batching lead data insertion (15 total batches)...",
  "Processing Batch 1 of 15...",
  "Processing Batch 3 of 15...",
  "Processing Batch 7 of 15...",
  "Processing Batch 12 of 15...",
  "✓ Finalizing CRM index updates...",
]

export function ProcessingView({ onComplete }: ProcessingViewProps) {
  const [logs, setLogs] = React.useState<string[]>([])
  const [progress, setProgress] = React.useState(0)
  const [batchNum, setBatchNum] = React.useState(1)

  React.useEffect(() => {
    let logIdx = 0
    const logInterval = setInterval(() => {
      if (logIdx < LOG_MESSAGES.length) {
        setLogs((prev) => [...prev, LOG_MESSAGES[logIdx]])
        setProgress((logIdx + 1) / LOG_MESSAGES.length * 100)
        
        // Simulating batch numbers update
        if (logIdx >= 11 && logIdx <= 14) {
          const batchMap = [1, 3, 7, 12]
          setBatchNum(batchMap[logIdx - 11])
        }
        
        logIdx++
      } else {
        clearInterval(logInterval)
        setTimeout(() => {
          onComplete()
        }, 1000) // Complete after logs end
      }
    }, 450)

    return () => clearInterval(logInterval)
  }, [onComplete])

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center p-8 bg-white border border-border rounded-2xl shadow-sm text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="relative mb-6">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-125" />
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 border border-orange-100 text-primary">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-foreground mb-1">AI Processing Your CSV</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Estimating completion time: ~5 seconds remaining.
      </p>

      {/* Progress Bar */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
          <span>Batch {batchNum} of 15</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted border border-border h-2 rounded-full overflow-hidden">
          <motion.div
            className="bg-primary h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          />
        </div>
      </div>

      {/* Live Logs Terminal */}
      <div className="w-full bg-zinc-950 text-zinc-300 rounded-xl p-4 text-left font-mono text-xs h-[180px] overflow-y-auto flex flex-col gap-1.5 shadow-inner">
        <AnimatePresence>
          {logs.map((log, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2"
            >
              {log.startsWith("✓") ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              ) : log.includes("Processing") ? (
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
              )}
              <span>{log.replace("✓ ", "")}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
