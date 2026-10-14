import "server-only"

import { requireOutletAccess } from "@/lib/outlet"

/*
 * Id outlet aktif yang sudah divalidasi: user harus anggota aktif
 * outlet itu. Dulu cookie outlet_id dibaca mentah dan RLS Supabase
 * yang membatasi aksesnya.
 */
export async function getCurrentOutletId() {
  const { activeOutlet } = await requireOutletAccess()

  return activeOutlet.id
}
