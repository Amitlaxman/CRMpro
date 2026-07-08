"use client"

import * as React from "react"
import { Sidebar } from "@/components/sidebar"
import { ImportModal } from "@/components/import-modal"
import { ResultDashboard } from "@/components/result-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"
import { FileSpreadsheet, Sparkles, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

type ImportFlowState = "idle" | "completed"

export default function Home() {
  const [flowState, setFlowState] = React.useState<ImportFlowState>("idle")
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  // Real dataset states returned from backend stream
  const [importedLeads, setImportedLeads] = React.useState<any[]>([])
  const [skippedLeads, setSkippedLeads] = React.useState<any[]>([])
  const [duplicateLeads, setDuplicateLeads] = React.useState<any[]>([])
  const [mappingLogs, setMappingLogs] = React.useState<any[]>([])
  const [statistics, setStatistics] = React.useState<any>(null)
  const [confidenceSummary, setConfidenceSummary] = React.useState<any>(null)

  const handleConfirmImport = (
    imported: any[],
    mappings: any[],
    fileName: string,
    duplicates: any[],
    skipped: any[],
    stats: any,
    confidence: any
  ) => {
    setImportedLeads(imported)
    setMappingLogs(mappings)
    setDuplicateLeads(duplicates)
    setSkippedLeads(skipped)
    setStatistics(stats)
    setConfidenceSummary(confidence)

    setIsModalOpen(false)
    setFlowState("completed")
  }

  const handleRestart = () => {
    setImportedLeads([])
    setMappingLogs([])
    setDuplicateLeads([])
    setSkippedLeads([])
    setStatistics(null)
    setConfidenceSummary(null)
    setFlowState("idle")
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0B0B0C] flex text-foreground transition-colors duration-200">
      {/* Fixed Sidebar navigation */}
      <Sidebar className="hidden md:flex shrink-0" />

      {/* Main Content Area */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col">
        {/* Top Header */}
        <header className="h-16 px-8 border-b border-border dark:border-[#2E2E33] bg-white dark:bg-[#121214] flex items-center justify-between shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-muted-foreground">Manage Leads</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-bold text-sm text-foreground">CSV Importer</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground bg-muted dark:bg-zinc-900 border border-border dark:border-zinc-850 px-2.5 py-1 rounded-md font-bold">
              Production Environment
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Content body container */}
        <main className="flex-1 p-8 md:p-10 max-w-[1100px] w-full mx-auto space-y-8">
          
          {flowState === "idle" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Page Headers */}
              <div className="flex flex-col gap-2.5 text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  AI CSV Importer
                </h1>
                <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                  Upload any CRM export and let AI automatically map, clean, and format your customer records.
                </p>
              </div>

              {/* Centered Upload Launch Area */}
              <div className="border border-border dark:border-zinc-800 bg-white dark:bg-[#121214] rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-xs min-h-[350px] transition-colors duration-200">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-primary border border-orange-100 dark:border-orange-900/30 mb-5 shadow-xs">
                  <FileSpreadsheet className="w-6.5 h-6.5" />
                </div>

                <h3 className="font-bold text-lg text-foreground mb-2">No file imported yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
                  Select your CSV list to clean duplicates and map fields automatically into your active dashboard.
                </p>

                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import CSV</span>
                </Button>
              </div>
            </div>
          )}

          {flowState === "completed" && (
            <ResultDashboard
              onRestart={handleRestart}
              importedLeads={importedLeads}
              skippedLeads={skippedLeads}
              duplicateLeads={duplicateLeads}
              mappingLogs={mappingLogs}
              statistics={statistics}
              confidenceSummary={confidenceSummary}
            />
          )}
        </main>
      </div>

      {/* Upload Wizard Overlay Modal */}
      <ImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  )
}
