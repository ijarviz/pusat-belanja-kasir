import { createClient } from "@/lib/supabase/client"
import type { ProductImageForm } from "./types"

const supabase = createClient()

export async function uploadProductImages(
  images: ProductImageForm[]
) {
  const urls: string[] = []

  for (const img of images) {
    if (img.isDeleted || !img.file) continue

    const ext = img.file.name.split(".").pop()

    const fileName = `${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, img.file)

    if (error) throw error

    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(fileName)

    urls.push(data.publicUrl)
  }

  return urls
}

function truncateText(text: string, max = 12) {
  if (text.length <= max) return text
  return text.slice(0, max) + "..."
}

export function formatCategoryCompact(fullPath?: string | null) {
  if (!fullPath) return "-"

  return fullPath
    .split(" > ")
    .filter(Boolean)
    .map((part, index, arr) => {
      if (index === arr.length - 1) return part
      return truncateText(part, 8)
    })
    .join(" > ")
}