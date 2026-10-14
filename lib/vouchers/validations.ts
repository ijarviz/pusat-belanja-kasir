import { z } from "zod"

export const voucherSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),

  description: z.string().nullable(),

  voucher_type: z.enum([
    "product",
    "shipping",
  ]),

  product_discount_type: z
    .enum(["percentage", "nominal"])
    .nullable(),

  product_discount_value: z
    .number()
    .nullable(),

  product_max_discount: z
    .number()
    .nullable(),

  shipping_discount_type: z
    .enum([
      "free_shipping",
      "shipping_discount",
    ])
    .nullable(),

  shipping_discount_value: z
    .number()
    .nullable(),

  min_purchase: z.number(),

  usage_limit: z
    .number()
    .nullable(),

  start_at: z.string(),

  end_at: z.string().nullable(),

  is_no_expiry: z.boolean(),

  is_active: z.boolean(),
})

export type VoucherInput =
  z.infer<typeof voucherSchema>