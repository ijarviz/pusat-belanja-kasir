export type Outlet = {
  id: string
  code: number
  name: string
  plan: string
  image_url?: string | null
}

export type Product = {
  id: string
  code: number
  // outlet: string
  outletId: string
  name: string
  sku: string
  
  barcode: string | null
  barcode_manual: boolean

  category?: Category | null
  category_id?: number | null
  description?: string | null

  urlImage: string | null
  images?: ProductImage[]

  stock: number
  weight: number
  length: number
  width: number
  height: number

  price: number
  priceDisc: number | null
  priceCost: number | null

  status: "active" | "inactive" | "draft" | "archived"

  deletedAt?: string | null
  has_variant?: boolean
  variant_count?: number
  variantConfig?: {
    name: string
    values: string[]
  }[]
  variants?: Variant[]
}

export type ProductFormState = {
  name: string
  sku: string
  barcode: string
  barcode_manual: boolean
  category_id: number | null
  description: string
  price: number
  price_disc: number
  stock: number
  weight: number
  length: number
  width: number
  height: number
  status: "active" | "draft" | "inactive"
}

export type ProductImage = {
  id: string
  image_url: string
  is_main: boolean | null
  sort_order: number | null
}

export type ProductImageForm = {
  id: string
  file?: File
  preview: string
  isDeleted: boolean
}

export type Category = {
  id: number
  name: string
  full_path: string | null
  level_1?: string | null
  level_2?: string | null
  level_3?: string | null
  level_4?: string | null
  level_5?: string | null
}

export type Variant = {
  id: string
  key?: string
  name: string
  option1?: string
  option2?: string
  sku: string
  barcode: string | null
  barcode_manual: boolean
  urlImage?: string
  stock: number
  price: number
  priceDisc: number | null
  priceCost: number | null
  status: "active" | "inactive"
  deletedAt?: string | null
}

export type VariantOptionValue = {
  id: string
  value: string
  image?: string
}

export type VariantOption = {
  id: string
  name: string
  values: {
    id: string
    value: string
    image?: string
    file?: File | null
  }[]
}

export type VariantRow = {
  id: string
  key: string
  option1: string
  option2?: string
  
  option1ValueId?: string
  option2ValueId?: string

  sku: string
  image?: string

  price: number
  price_disc: number

  stock: number
  barcode: string | null
  barcode_manual: boolean
}
