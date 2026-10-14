"use client"

import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

interface ImageDefaultProps {
  src?: string | null
  alt?: string
  className?: string
  iconSize?: number
}

export function ImageDefault({
  src,
  alt = "",
  className,
  iconSize = 20,
}: ImageDefaultProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex w-full h-full items-center justify-center rounded-md border bg-muted text-muted-foreground",
          className
        )}
      >
        <HugeiconsIcon
          icon={Image01Icon}
          size={iconSize}
          strokeWidth={1.8}
        />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn(
        "rounded-md border object-cover",
        className
      )}
    />
  )
}