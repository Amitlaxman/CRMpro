"use client"

import * as React from "react"
import { Upload, FileSpreadsheet, X, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface UploadZoneProps {
  onFileSelect?: (file: File) => void
  onFileRemove?: () => void
  onNextStep?: () => void
}

export function UploadZone({ onFileSelect, onFileRemove, onNextStep }: UploadZoneProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const inputRef = React.useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE_MB = 25
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

  const validateFile = (selectedFile: File): boolean => {
    setError(null)

    const fileName = selectedFile.name.toLowerCase()
    if (!fileName.endsWith(".csv")) {
      const errMsg = "Invalid file type. Please upload a CSV file."
      setError(errMsg)
      toast.error(errMsg)
      return false
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      const errMsg = `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`
      setError(errMsg)
      toast.error(errMsg)
      return false
    }

    if (selectedFile.size === 0) {
      const errMsg = "The selected file is empty."
      setError(errMsg)
      toast.error(errMsg)
      return false
    }

    return true
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
        onFileSelect?.(droppedFile)
        toast.success(`Successfully uploaded "${droppedFile.name}"`)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
        onFileSelect?.(selectedFile)
        toast.success(`Successfully uploaded "${selectedFile.name}"`)
      }
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const removeFile = () => {
    setFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    onFileRemove?.()
    toast.info("File removed")
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".csv"
        onChange={handleChange}
      />

      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          className={cn(
            "group relative flex flex-col items-center justify-center min-h-[320px] border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300",
            dragActive
              ? "border-primary bg-primary/10 ring-4 ring-primary/10 scale-[0.99]"
              : "border-primary/20 hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          {/* Subtle violet inner glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Sparkle background glow */}
          <div className="absolute w-24 h-24 rounded-full bg-primary/10 blur-xl opacity-50 group-hover:opacity-100 group-hover:bg-primary/20 transition-all duration-500 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(139,92,246,0.15)] group-hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] group-hover:scale-110 transition-all duration-300">
              <Upload className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-semibold text-lg tracking-tight">
                Drag & drop your CSV file here
              </p>
              <p className="text-sm text-muted-foreground">
                or <span className="text-primary font-medium hover:underline">click to browse your computer</span>
              </p>
            </div>

            <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2 max-w-[280px]">
              <p>Only .csv files are supported. Max file size: 25MB.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col items-center p-6 border border-border bg-card rounded-2xl shadow-sm transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between w-full gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="flex flex-col text-left">
                <h4 className="font-medium text-base text-foreground line-clamp-1 max-w-[320px] md:max-w-[450px]">
                  {file.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg h-9 w-9"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-3.5 mt-8 w-full">
            <Button
              variant="outline"
              onClick={handleButtonClick}
              className="flex-1 rounded-xl h-11 hover:bg-muted font-semibold transition-all"
            >
              Replace File
            </Button>
            <Button
              variant="default"
              className="flex-1 rounded-xl h-11 font-semibold transition-all bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20"
              onClick={onNextStep}
            >
              Next: Map Columns
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 mt-4 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm font-medium animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
