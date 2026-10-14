import type {
  Product,
  ProductImage,
} from "./types"

import type {
  Variant,
  VariantRow,
  VariantOption,
} from "./types"

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? ""
}

function makeOptionValueId(optionName: string, value: string) {
  return `${optionName}:${normalize(value)}`
}

export function getMainImage(images: ProductImage[]) {
  if (!images?.length) return null

  const main = images.find((i) => i.is_main === true)

  if (main) return main

  // fallback hanya kalau ada sort_order valid
  const sorted = [...images].sort(
    (a, b) =>
      (a.sort_order ?? 999) -
      (b.sort_order ?? 999)
  )

  return sorted.length ? sorted[0] : null
}


export function mapProduct(
  item: any
): Product {
  const images: ProductImage[] =
    item.images ?? []

  const mainImage =
    getMainImage(images)

  return {
    id: item.id,
    code: item.code,
    // outlet: item.outlet_code,
    // outlet: item.outlet_id,
    outletId: item.outlet_id,

    name: item.name,
    sku: item.sku,
    barcode: item.barcode ?? null,
    barcode_manual: item.barcode_manual ?? false,
    // category: item.category,
    category: item.category ?? null,
    category_id: item.category_id,
    description: item.description,

    has_variant: item.has_variant ?? false,
    variant_count: item.variant_count,
    variantConfig: item.variant_config ?? [],

    urlImage:
      mainImage?.image_url || null,

    stock: item.stock,

    weight: item.weight,
    length: item.length,
    width: item.width,
    height: item.height,
    // lowestStock: item.lowest_stock,

    // stockStatus: item.stock_status,

    price: item.price,
    priceDisc: item.price_disc,
    priceCost: item.price_cost,

    status: item.status,

    deletedAt: item.deleted_at,

    images,
    variants:
      item.variants
        ?.filter((v: any) => !v.deleted_at)
        .map((v: any) => ({
          id: v.id,

          name: v.name,

          option1: v.option1,
          option2: v.option2,

          sku: v.sku,
          barcode: v.barcode ?? null,
          barcode_manual: v.barcode_manual ?? false,

          urlImage: v.url_image,

          stock: v.stock,

          price: v.price,
          priceDisc: v.price_disc,
          priceCost: v.price_cost,

          status: v.status,

          deletedAt: v.deleted_at,
        })) || [],
  }
}


export function transformVariantsToOptions(
  variants: any[],
  variantConfig?: any[]
): VariantOption[] {
  if (!variants?.length) return []

  const option1Map = new Map<
    string,
    {
      value: string
      image?: string
      id: string
    }
  >()

  const option2Map = new Map<
    string,
    {
      value: string
      id: string
    }
  >()

  for (const v of variants) {
    if (v.option1) {
      const normalized = normalize(v.option1)

      if (!option1Map.has(normalized)) {
        option1Map.set(normalized, {
          value: v.option1,
          image: v.urlImage || v.url_image || "",
          id: `option1:${v.id}`,
        })
      }
    }

    if (v.option2) {
      const normalized = normalize(v.option2)

      if (!option2Map.has(normalized)) {
        option2Map.set(normalized, {
          value: v.option2,
          id: `option2:${v.id}`,
        })
      }
    }
  }

  const options: VariantOption[] = [
    {
      id: "option-1",

      name:
        variantConfig?.[0]?.name ||
        "Variasi 1",

      values:
        Array.from(option1Map.values()).map(
          (v) => ({
            id: v.id,
            value: v.value,
            image: v.image || "",
          })
        ),
    },
  ]

  if (option2Map.size > 0) {
    options.push({
      id: "option-2",

      name:
        variantConfig?.[1]?.name ||
        "Variasi 2",

      values:
        Array.from(option2Map.values()).map(
          (v) => ({
            id: v.id,
            value: v.value,
            image: "",
          })
        ),
    })
  }

  return options
}


export function transformVariantsToRows(
  variants: Variant[]
): VariantRow[] {
  if (!variants?.length) return []

  // Cari stable ID untuk setiap value
  const option1Ids = new Map<string, string>()
  const option2Ids = new Map<string, string>()

  for (const v of variants) {
    if (v.option1) {
      const normalized = normalize(v.option1)

      if (!option1Ids.has(normalized)) {
        option1Ids.set(
          normalized,
          `option1:${v.id}`
        )
      }
    }

    if (v.option2) {
      const normalized = normalize(v.option2)

      if (!option2Ids.has(normalized)) {
        option2Ids.set(
          normalized,
          `option2:${v.id}`
        )
      }
    }
  }

  return variants.map((v) => {
    const option1 = v.option1 ?? ""
    const option2 = v.option2 ?? ""

    return {
      id: v.id,

      key:
        v.key ??
        `${normalize(option1)}__${normalize(option2)}`,

      option1,
      option2,

      // =========================================
      // STABLE VALUE ID
      // =========================================

      option1ValueId:
        option1
          ? option1Ids.get(
              normalize(option1)
            )
          : undefined,

      option2ValueId:
        option2
          ? option2Ids.get(
              normalize(option2)
            )
          : undefined,

      sku: v.sku ?? "",

      image: v.urlImage ?? "",
      file: null,

      price: v.price ?? 0,

      price_disc:
        v.priceDisc ?? 0,

      price_cost:
        v.priceCost ?? 0,

      stock:
        v.stock ?? 0,

      barcode:
        v.barcode ?? null,

      barcode_manual:
        v.barcode
          ? v.barcode_manual ?? false
          : true,
    }
  })
}