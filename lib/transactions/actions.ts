"use server"

import { assertTransactionInOutlet, requireOutletAccess } from "@/lib/access"
import { execute } from "@/lib/db"

export async function updateTransactionFieldAction(
  id: string,
  payload: Partial<{
    status: string
    payment_status: string
  }>
) {
  const { activeOutlet } = await requireOutletAccess()
  await assertTransactionInOutlet(id, activeOutlet.id)

  const sets: string[] = []
  const params: unknown[] = []

  if (payload.status !== undefined) {
    sets.push("status = ?")
    params.push(payload.status)
  }

  if (payload.payment_status !== undefined) {
    sets.push("payment_status = ?")
    params.push(payload.payment_status)
  }

  sets.push("updated_at = CURRENT_TIMESTAMP(6)")

  await execute(
    `UPDATE transactions SET ${sets.join(", ")} WHERE id = ?`,
    [...params, id]
  )
}
