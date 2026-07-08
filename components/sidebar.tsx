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
  { label: "Manage Leads", icon: Users },
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
