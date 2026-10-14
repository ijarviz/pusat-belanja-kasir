import { createClient } from "@/lib/supabase/server"
import { getActiveOutlet } from "@/lib/outlet"

export async function getTransactions(
  channel?: string
) {
  const supabase = await createClient()

  const { activeOutlet } = await getActiveOutlet()

  let query = supabase
    .from("transactions")
    .select("*")
    .eq("outlet_id", activeOutlet.id)

  if (channel) {
    query = query.eq("channel", channel)
  }

  const { data, error } = await query.order(
    "created_at",
    {
      ascending: false,
    }
  )

  if (error) {
    console.error(
      "[getTransactions] transaction error:",
      error
    )

    throw error
  }

  const transactions = data ?? []

  const destinationIds = [
    ...new Set(
      transactions
        .map(
          (transaction) =>
            transaction.shipping_destination_id
        )
        .filter(
          (id): id is number =>
            id !== null &&
            id !== undefined
        )
    ),
  ]

  console.log(
    "[getTransactions] destinationIds:",
    destinationIds
  )

  if (destinationIds.length === 0) {
    return transactions.map((transaction) => ({
      ...transaction,
      autokirim_area: null,
    }))
  }

  const {
    data: areas,
    error: areaError,
  } = await supabase
    .from("autokirim_area")
    .select(`
      district_id,
      district_name,
      regency_name,
      province_name,
      postcode
    `)
    .in("district_id", destinationIds)

  if (areaError) {
    console.error(
      "[getTransactions] area error:",
      areaError
    )

    throw areaError
  }

  console.log(
    "[getTransactions] areas:",
    areas
  )

  const areaMap = new Map(
    (areas ?? []).map((area) => [
      String(area.district_id),
      area,
    ])
  )

  const result = transactions.map((transaction) => {
    const destinationId =
      transaction.shipping_destination_id

    const area =
      destinationId !== null &&
      destinationId !== undefined
        ? areaMap.get(
            String(destinationId)
          ) ?? null
        : null

    console.log(
      "[getTransactions] mapping:",
      {
        transaction_id: transaction.id,
        buyer_name: transaction.buyer_name,
        shipping_destination_id:
          destinationId,
        shipping_destination_id_type:
          typeof destinationId,
        area,
      }
    )

    return {
      ...transaction,
      autokirim_area: area,
    }
  })

  return result
}

export async function getTransactionById(
  id: string
) {
  const supabase = await createClient()

  const { activeOutlet } = await getActiveOutlet()

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("outlet_id", activeOutlet.id)
    .single()

  if (error) {
    throw error
  }

  let autokirim_area = null

  if (
    data.shipping_destination_id !== null &&
    data.shipping_destination_id !== undefined
  ) {
    const {
      data: area,
      error: areaError,
    } = await supabase
      .from("autokirim_area")
      .select(`
        district_id,
        district_name,
        regency_name,
        province_name,
        postcode
      `)
      .eq(
        "district_id",
        data.shipping_destination_id
      )
      .maybeSingle()

    if (areaError) {
      throw areaError
    }

    autokirim_area = area
  }

  return {
    ...data,
    autokirim_area,
  }
}