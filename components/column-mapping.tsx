"use client"

import * as React from "react"
import { Sparkles, ArrowRight, Check, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ColumnMappingProps {
  fileName: string
  onBack: () => void
  onNext: () => void
}

interface MappingItem {
  csvHeader: string
  sampleData: string
  crmField: string
  isMatched: boolean
}

const CRM_FIELDS = [
  "First Name",
  "Last Name",
  "Email Address",
  "Phone Number",
  "Company Name",
  "Job Title",
  "Country",
  "Skip Column (Do Not Import)",
]

export function ColumnMapping({ fileName, onBack, onNext }: ColumnMappingProps) {
  const [mappings, setMappings] = React.useState<MappingItem[]>([
    { csvHeader: "first_name", sampleData: "John, Sarah, Michael", crmField: "First Name", isMatched: true },
    { csvHeader: "last_name", sampleData: "Smith, Connor, Scott", crmField: "Last Name", isMatched: true },
    { csvHeader: "email_addr", sampleData: "john@example.com, sarah.c@gmail.com", crmField: "Email Address", isMatched: true },
    { csvHeader: "phone_no", sampleData: "+1 (555) 019-2834, +1 (555) 014-9988", crmField: "Phone Number", isMatched: true },
    { csvHeader: "company_name", sampleData: "Acme Corp, Vercel Inc, Stripe", crmField: "Company Name", isMatched: true },
    { csvHeader: "job_title", sampleData: "Software Engineer, Product Manager", crmField: "Job Title", isMatched: true },
    { csvHeader: "annual_rev", sampleData: "$250,000, $1.2M, $500,000", crmField: "Skip Column (Do Not Import)", isMatched: false },
  ])

  const handleFieldChange = (index: number, newField: string) => {
    setMappings((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        crmField: newField,
        isMatched: newField !== "Skip Column (Do Not Import)",
      }
      return updated
    })
  }

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Title Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Map CSV Columns</h2>
        <p className="text-muted-foreground text-sm">
          Match the columns from your CSV file to the CRM database fields. Our AI has auto-matched them based on headers and sample data.
        </p>
      </div>

      {/* Info Stats Box */}
      <div className="p-5 border border-border bg-card/60 backdrop-blur-sm rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">File selected</p>
          <p className="font-semibold text-foreground text-sm line-clamp-1">{fileName}</p>
          <p className="text-xs text-muted-foreground">1,248 rows detected</p>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-56">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1 text-primary">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              AI Match Confidence
            </span>
            <span className="text-primary">94%</span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden border border-border">
            <div className="bg-primary h-full rounded-full w-[94%] shadow-[0_0_10px_rgba(139,92,246,0.3)]" />
          </div>
        </div>
      </div>

      {/* Mappings List */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-12 gap-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-5 md:col-span-6">CSV Source Column</div>
          <div className="col-span-7 md:col-span-6">CRM Target Field</div>
        </div>

        <div className="flex flex-col gap-3">
          {mappings.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "grid grid-cols-12 items-center gap-4 p-4 rounded-xl border bg-card/40 transition-all",
                item.crmField === "Skip Column (Do Not Import)"
                  ? "border-muted/30 opacity-70"
                  : "border-border hover:border-primary/20"
              )}
            >
              {/* CSV Column detail */}
              <div className="col-span-5 md:col-span-6 flex flex-col gap-1.5">
                <span className="font-mono text-sm font-semibold text-foreground px-2 py-0.5 bg-muted/60 border border-border rounded w-fit">
                  {item.csvHeader}
                </span>
                <span className="text-xs text-muted-foreground truncate pr-2">
                  Sample: <span className="italic">{item.sampleData}</span>
                </span>
              </div>

              {/* Action Dropdown Field selector */}
              <div className="col-span-7 md:col-span-6 flex items-center justify-between gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-10 rounded-lg text-left text-sm font-medium border-border/80 hover:bg-muted"
                    >
                      <span className="truncate">{item.crmField}</span>
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                    {CRM_FIELDS.map((field) => (
                      <DropdownMenuItem
                        key={field}
                        onClick={() => handleFieldChange(idx, field)}
                        className="text-xs py-2 hover:bg-muted"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{field}</span>
                          {item.crmField === field && <Check className="w-3.5 h-3.5 text-primary" />}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {item.isMatched && (
                  <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>AI Match</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack} className="h-11 px-6 font-semibold rounded-xl">
          Back
        </Button>
        <Button
          onClick={onNext}
          className="h-11 px-6 font-semibold rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20"
        >
          Next: Preview & Import
        </Button>
      </div>
    </div>
  )
}

function ChevronDown() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground opacity-60"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
