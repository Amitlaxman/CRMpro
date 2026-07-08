"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle, CheckCircle, ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface DataPreviewProps {
  onBack: () => void
  onImportComplete: () => void
}

interface TableRowData {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  status: "valid" | "warning" | "error"
  issue?: string
}

export function DataPreview({ onBack, onImportComplete }: DataPreviewProps) {
  const [activeTab, setActiveTab] = React.useState<"all" | "valid" | "warning" | "error">("all")

  const mockRows: TableRowData[] = [
    { id: 1, firstName: "John", lastName: "Doe", email: "john.doe@company.com", phone: "+1 (555) 019-2834", company: "Acme Corp", status: "valid" },
    { id: 2, firstName: "Sarah", lastName: "Connor", email: "sarah.c@gmail.com", phone: "+1 (555) 014-9988", company: "Cyberdyne", status: "valid" },
    { id: 3, firstName: "Michael", lastName: "Scott", email: "mscott@dundermifflin.com", phone: "+1 (555) 017-4839", company: "Dunder Mifflin", status: "valid" },
    { id: 14, firstName: "Jane", lastName: "Doe", email: "john.doe#gmail.com", phone: "+1 (555) 018-2834", company: "Stripe", status: "error", issue: 'Row 14: Invalid email format "john.doe#gmail.com"' },
    { id: 15, firstName: "David", lastName: "Brent", email: "dbrent@wernhamhogg.co.uk", phone: "555-0100", company: "Wernham Hogg", status: "warning", issue: 'Row 15: Phone number format warning "555-0100"' },
    { id: 29, firstName: "Pam", lastName: "Beesly", email: "pam@dundermifflin.com", phone: "+1 (555) 012-4411", company: "", status: "error", issue: 'Row 29: Missing required company_name' },
    { id: 30, firstName: "Dwight", lastName: "Schrute", email: "dschrute@dundermifflin.com", phone: "+1 (555) 013-8899", company: "Schrute Farms", status: "valid" },
    { id: 41, firstName: "Jim", lastName: "Halpert", email: "jim@dundermifflin.com", phone: "N/A", company: "Dunder Mifflin", status: "warning", issue: 'Row 41: Short phone input "N/A"' },
  ]

  const filteredRows = mockRows.filter((row) => {
    if (activeTab === "all") return true
    return row.status === activeTab
  })

  const errorsCount = mockRows.filter((r) => r.status === "error").length
  const warningsCount = mockRows.filter((r) => r.status === "warning").length
  const validCount = mockRows.filter((r) => r.status === "valid").length

  const handleImport = () => {
    toast.success(`Successfully imported ${validCount} valid contacts to CRMpro!`)
    onImportComplete()
  }

  return (
    <div className="w-full max-w-5xl flex flex-col gap-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Title Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Review & Import</h2>
        <p className="text-muted-foreground text-sm">
          We found some validation errors in your CSV file. You can review warnings or errors, and choose to import only the valid rows.
        </p>
      </div>

      {/* Validation Stats Bar */}
      <div className="grid grid-cols-3 border border-border bg-card/40 backdrop-blur-sm rounded-2xl p-4 divide-x divide-border">
        <div className="flex items-center gap-3 px-4 justify-center md:justify-start">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground">{validCount}</span>
            <span className="text-xs text-muted-foreground font-medium">Valid Contacts</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 justify-center md:justify-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground">{warningsCount}</span>
            <span className="text-xs text-muted-foreground font-medium">Warnings</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 justify-center md:justify-start">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground">{errorsCount}</span>
            <span className="text-xs text-muted-foreground font-medium">Errors</span>
          </div>
        </div>
      </div>

      {/* Core Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Filter Tabs & Table Grid */}
        <div className="lg:col-span-8 flex flex-col gap-4 border border-border bg-card/20 rounded-2xl overflow-hidden p-4">
          <div className="flex gap-1.5 border-b border-border pb-3">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              All Rows
            </button>
            <button
              onClick={() => setActiveTab("valid")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === "valid" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Valid
            </button>
            <button
              onClick={() => setActiveTab("warning")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === "warning" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Warnings
            </button>
            <button
              onClick={() => setActiveTab("error")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === "error" ? "bg-destructive/10 text-destructive border border-destructive/20" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Errors
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-border/80 rounded-xl">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-3 w-12 text-center">Row</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Company</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-muted/30 transition-all",
                      row.status === "error" && "bg-destructive/5",
                      row.status === "warning" && "bg-amber-500/5"
                    )}
                  >
                    <td className="p-3 text-center text-xs font-semibold text-muted-foreground font-mono">{row.id}</td>
                    <td className="p-3 font-medium">
                      {row.firstName} {row.lastName}
                    </td>
                    <td
                      className={cn(
                        "p-3",
                        row.status === "error" && row.email.includes("#") && "text-destructive font-semibold bg-destructive/10 rounded"
                      )}
                    >
                      {row.email}
                    </td>
                    <td
                      className={cn(
                        "p-3",
                        row.status === "warning" && row.phone === "555-0100" && "text-amber-500 bg-amber-500/10 rounded"
                      )}
                    >
                      {row.phone}
                    </td>
                    <td
                      className={cn(
                        "p-3",
                        row.status === "error" && row.company === "" && "bg-destructive/10 rounded min-w-[80px]"
                      )}
                    >
                      {row.company || <span className="text-destructive font-semibold italic text-xs">Missing</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Validation Messages list */}
        <div className="lg:col-span-4 flex flex-col gap-4 p-5 border border-border bg-card/60 backdrop-blur-sm rounded-2xl">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span>Validation Issues</span>
          </h3>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
            {mockRows
              .filter((row) => row.status === "error" || row.status === "warning")
              .map((row) => (
                <div
                  key={row.id}
                  className={cn(
                    "p-3 rounded-xl border text-xs leading-relaxed flex flex-col gap-1",
                    row.status === "error"
                      ? "border-destructive/20 bg-destructive/5 text-destructive"
                      : "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-500"
                  )}
                >
                  <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    {row.status === "error" ? <AlertCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    Row {row.id}
                  </span>
                  <span>{row.issue}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack} className="h-11 px-6 font-semibold rounded-xl">
          Go Back
        </Button>
        <Button
          onClick={handleImport}
          className="h-11 px-6 font-semibold rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Import {validCount} Valid Rows</span>
        </Button>
      </div>
    </div>
  )
}
