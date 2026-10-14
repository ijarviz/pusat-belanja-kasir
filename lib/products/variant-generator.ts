import type {
  VariantRow,
  VariantOption,
} from "@/lib/products/types"

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? ""
}

function makeKey(v1: string, v2?: string) {
  return `${normalize(v1)}__${normalize(v2)}`
}

export function generateVariantRows(
  options: VariantOption[],
  prev: VariantRow[]
): VariantRow[] {
  const option1 = options[0]
  const option2 = options[1]

  const values1 =
    option1?.values.filter(
      (v) => v.value.trim()
    ) ?? []

  const values2 =
    option2?.values.filter(
      (v) => v.value.trim()
    ) ?? []

  const rows: VariantRow[] = []

  // =====================================================
  // MAP ROW LAMA BERDASARKAN STABLE VALUE ID
  // =====================================================

  const prevMap = new Map<
    string,
    VariantRow
  >()

  for (const row of prev) {
    const identity = option2
      ? `${row.option1ValueId ?? ""}__${row.option2ValueId ?? ""}`
      : `${row.option1ValueId ?? ""}`

    prevMap.set(identity, row)
  }

  // =====================================================
  // GENERATE
  // =====================================================

  for (const v1 of values1) {

    // ===================================================
    // SINGLE VARIANT
    // ===================================================

    if (!option2) {
      const key = makeKey(v1.value)

      const identity = v1.id

      const existing =
        prevMap.get(identity)

      rows.push({
        id:
          existing?.id ??
          crypto.randomUUID(),

        key,

        option1: v1.value,

        option1ValueId: v1.id,

        sku:
          existing?.sku ?? "",

        image:
          existing?.image ?? "",

        price:
          existing?.price ?? 0,

        price_disc:
          existing?.price_disc ?? 0,

        stock:
          existing?.stock ?? 0,

        barcode:
          existing?.barcode ?? null,

        barcode_manual:
          existing?.barcode_manual ?? false,
      })

      continue
    }

    // ===================================================
    // DOUBLE VARIANT
    // ===================================================

    for (const v2 of values2) {

      const key = makeKey(
        v1.value,
        v2.value
      )

      const identity =
        `${v1.id}__${v2.id}`

      const existing =
        prevMap.get(identity)

      rows.push({
        id:
          existing?.id ??
          crypto.randomUUID(),

        key,

        option1: v1.value,
        option2: v2.value,

        option1ValueId: v1.id,
        option2ValueId: v2.id,

        sku:
          existing?.sku ?? "",

        image:
          existing?.image ?? "",

        price:
          existing?.price ?? 0,

        price_disc:
          existing?.price_disc ?? 0,

        stock:
          existing?.stock ?? 0,

        barcode:
          existing?.barcode ?? null,

        barcode_manual:
          existing?.barcode_manual ?? false,
      })
    }
  }

  console.log(
    "GENERATED ROWS",
    rows.map((r) => ({
      id: r.id,
      key: r.key,
      option1: r.option1,
      option2: r.option2,
      option1ValueId:
        r.option1ValueId,
      option2ValueId:
        r.option2ValueId,
      stock: r.stock,
    }))
  )

  return rows
}