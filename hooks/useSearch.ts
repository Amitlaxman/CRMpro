"use client"

import * as React from "react"

export function useSearch<T extends Record<string, any>>(data: T[], searchTerm: string): T[] {
  return React.useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase()
    if (!trimmed) return data

    return data.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false
        return val.toString().toLowerCase().includes(trimmed)
      })
    })
  }, [data, searchTerm])
}
