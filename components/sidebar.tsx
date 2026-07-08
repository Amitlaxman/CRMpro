"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Zap,
  Users,
  Database,
  Globe,
  MessageSquare,
  PhoneCall,
  Sliders,
  Key,
  Briefcase,
  ChevronDown,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Generate Leads", icon: Zap },
  { label: "Manage Leads", icon: Users },
  { label: "Lead Sources", icon: Database },
  { label: "Ad Accounts", icon: Globe },
  { label: "WhatsApp", icon: MessageSquare },
  { label: "Tele Calling", icon: PhoneCall },
  { label: "CRM Fields", icon: Sliders },
  { label: "API Center", icon: Key },
  { label: "Business Center", icon: Briefcase },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [activeItem, setActiveItem] = React.useState("Manage Leads")

  return (
    <aside
      className={cn(
        "w-[280px] h-screen bg-white dark:bg-[#0B0B0C] border-r border-border dark:border-[#2E2E33] flex flex-col shrink-0 sticky top-0 overflow-y-auto select-none transition-colors duration-200",
        className
      )}
    >
      {/* Top Logo */}
      <div className="h-16 px-6 border-b border-border dark:border-[#2E2E33] flex items-center gap-2.5 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white shadow-sm">
          <FileSpreadsheet className="w-4.5 h-4.5" />
        </div>
        <span className="font-bold text-lg tracking-tight text-foreground">CRMpro</span>
      </div>

      {/* Company card */}
      <div className="p-4 mx-2 my-3 rounded-xl border border-border dark:border-[#2E2E33] bg-muted/40 dark:bg-zinc-900/30 hover:bg-muted/70 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
              GE
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground leading-tight">GrowEasy</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Enterprise workspace</span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === activeItem
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => setActiveItem(item.label)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left",
                isActive
                  ? "bg-[#E6F4EA] dark:bg-emerald-950/30 text-[#137333] dark:text-emerald-400 font-bold"
                  : "text-muted-foreground hover:bg-muted dark:hover:bg-zinc-900 hover:text-foreground dark:hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-[#137333] dark:text-emerald-400" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
