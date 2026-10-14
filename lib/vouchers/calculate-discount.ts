import { Voucher } from "./types"

export function calculateProductVoucher(
  voucher: Voucher,
  subtotal: number
): number {
  if (voucher.voucher_type !== "product") {
    return 0
  }

  if (subtotal < voucher.min_purchase) {
    return 0
  }

  if (
    voucher.product_discount_type ===
    "nominal"
  ) {
    return Math.min(
      voucher.product_discount_value ?? 0,
      subtotal
    )
  }

  if (
    voucher.product_discount_type ===
    "percentage"
  ) {
    const discount = Math.floor(
      subtotal *
        ((voucher.product_discount_value ??
          0) /
          100)
    )

    if (
      voucher.product_max_discount
    ) {
      return Math.min(
        discount,
        voucher.product_max_discount
      )
    }

    return discount
  }

  return 0
}

export function calculateShippingVoucher(
  voucher: Voucher,
  shippingCost: number
): number {
  if (
    voucher.voucher_type !== "shipping"
  ) {
    return 0
  }

  if (
    voucher.shipping_discount_type ===
    "free_shipping"
  ) {
    return shippingCost
  }

  if (
    voucher.shipping_discount_type ===
    "shipping_discount"
  ) {
    return Math.min(
      voucher.shipping_discount_value ??
        0,
      shippingCost
    )
  }

  return 0
}