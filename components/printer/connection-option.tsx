"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  BluetoothIcon,
  UsbIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

type ConnectionType =
  | "usb"
  | "bluetooth"

type Props = {
  type: ConnectionType
  title: string
  description: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}

export default function ConnectionOption({
  type,
  title,
  description,
  selected,
  disabled = false,
  onClick,
}: Props) {
  const icon =
    type === "usb"
      ? UsbIcon
      : BluetoothIcon

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition",
        "hover:bg-muted/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected &&
          "border-primary bg-primary/5 ring-1 ring-primary"
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md border",
          selected && "border-primary"
        )}
      >
        <HugeiconsIcon
          icon={icon}
          className="size-5"
        />
      </div>

      <div className="min-w-0">
        <p className="font-medium">
          {title}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  )
}