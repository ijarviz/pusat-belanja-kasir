"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function CopyLogButton({ text }: { text: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          toast.success("Log disalin")
        } catch {
          toast.error("Gagal menyalin log")
        }
      }}
    >
      Salin
    </Button>
  )
}
