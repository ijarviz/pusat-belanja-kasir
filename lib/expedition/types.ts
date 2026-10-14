// lib/expedition/types.ts

export type ExpeditionRow = {
  id: string
  is_active: boolean

  expedition: {
    id: string
    code: string
    name: string
    image_url?: string | null
  } | null
}