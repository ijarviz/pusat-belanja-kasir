import { createClient } from "@/lib/supabase/client"
import type {
  StockMovement,
  StockMovementType,
} from "./types"

interface StockMutationParams {
  product_id?: string | null
  variant_id?: string | null
  quantity: number
  type: StockMovementType
  note?: string | null
}

export async function calculateStock({
  product_id = null,
  variant_id = null,
  quantity,
  type,
  note = null,
}: StockMutationParams): Promise<StockMovement> {
  const supabase = createClient()

  // ==========================================
  // VALIDASI TARGET
  // ==========================================

  if (!product_id && !variant_id) {
    throw new Error(
      "product_id atau variant_id wajib diisi"
    )
  }

  if (product_id && variant_id) {
    throw new Error(
      "product_id dan variant_id tidak boleh diisi bersamaan"
    )
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < 0
  ) {
    throw new Error(
      "quantity harus berupa angka bulat dan tidak boleh kurang dari 0"
    )
  }

  // ==========================================
  // ADJUSTMENT
  // ==========================================

  if (type === "adjustment") {
    const { data, error } =
      await supabase.rpc(
        "calculate_stock",
        {
          p_product_id: product_id,
          p_variant_id: variant_id,
          p_quantity: quantity,
          p_type: "adjustment",
          p_note: note,
        }
      )

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error(
        "Adjustment stok gagal."
      )
    }

    return data as StockMovement
  }

  // ==========================================
  // IN
  // ==========================================

  if (type === "in") {
    const { data, error } =
      await supabase.rpc(
        "add_stock",
        {
          p_product_id: product_id,
          p_variant_id: variant_id,
          p_quantity: quantity,
          p_reference_type:
            "stock_opname",
          p_reference_id: null,
          p_note: note,
        }
      )

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error(
        "Penambahan stok gagal."
      )
    }

    return data as StockMovement
  }

  // ==========================================
  // OUT
  // ==========================================

  if (type === "out") {
    const { data, error } =
      await supabase.rpc(
        "remove_stock",
        {
          p_product_id: product_id,
          p_variant_id: variant_id,
          p_quantity: quantity,
          p_reference_type:
            "stock_opname",
          p_reference_id: null,
          p_note: note,
        }
      )

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error(
        "Pengurangan stok gagal."
      )
    }

    return data as StockMovement
  }

  throw new Error(
    "Tipe stok tidak valid."
  )
}