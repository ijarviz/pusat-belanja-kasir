"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { AlTracking } from "@/lib/autolaris"
import { cn } from "@/lib/utils"

// Popup "Lacak Pengiriman" Order Web: timeline riwayat kurir dari Autolaris
// /lacak (terbaru di atas). Foto bukti pengantaran tampil di event-nya.
export function TrackingDialog({
  transactionId,
  awb,
  open,
  onOpenChange,
}: {
  transactionId: string
  awb: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [tracking, setTracking] = useState<AlTracking | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    fetch(`/api/shipment/track/${transactionId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json?.ok) {
          setTracking(json.tracking)
          setError(null)
        } else {
          setError(json?.message || "Gagal melacak resi")
        }
      })
      .catch(() => !cancelled && setError("Gagal melacak resi"))

    return () => {
      cancelled = true
    }
  }, [open, transactionId])

  const loading = open && !tracking && !error

  // Foto POD tanpa event yang memuatnya: tempel ke event terbaru.
  const podShown = tracking?.events.some((e) => e.image === tracking.podImage)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setTracking(null)
          setError(null)
        }
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lacak Pengiriman</DialogTitle>
          <DialogDescription>
            {[tracking?.courierName, tracking?.service].filter(Boolean).join(" · ") ||
              "Riwayat dari Autolaris"}
            {" — "}
            <span className="font-mono font-semibold text-foreground">
              {tracking?.awb ?? awb ?? "-"}
            </span>
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat riwayat...
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {tracking && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Status: </span>
                <span className="font-semibold">{tracking.stats ?? "-"}</span>
              </div>
              {tracking.etd && (
                <div>
                  <span className="text-muted-foreground">Estimasi: </span>
                  {tracking.etd}
                </div>
              )}
              {tracking.podReceiver && (
                <div>
                  <span className="text-muted-foreground">Penerima: </span>
                  {tracking.podReceiver}
                </div>
              )}
            </div>

            {tracking.events.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Belum ada riwayat pengiriman.
              </div>
            ) : (
              <ol className="relative ml-2 border-l">
                {tracking.events.map((event, index) => {
                  const image =
                    event.image ||
                    (index === 0 && !podShown ? tracking.podImage : null)

                  return (
                    <li key={index} className="mb-5 ml-5 last:mb-0">
                      <span
                        className={cn(
                          "absolute -left-[7px] mt-1 h-3.5 w-3.5 rounded-full border-2 border-background",
                          index === 0 ? "bg-primary" : "bg-muted-foreground/40"
                        )}
                      />
                      <div className="text-xs text-muted-foreground">
                        {[event.date, event.time].filter(Boolean).join(" ")}
                      </div>
                      <div className={cn("text-sm", index === 0 && "font-semibold")}>
                        {event.status}
                      </div>
                      {event.desc && event.desc !== event.status && (
                        <div className="text-sm text-muted-foreground">{event.desc}</div>
                      )}
                      {image && (
                        <a href={image} target="_blank" rel="noreferrer" className="mt-2 block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image}
                            alt="Bukti pengantaran"
                            className="max-h-56 rounded-md border object-contain"
                          />
                        </a>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
