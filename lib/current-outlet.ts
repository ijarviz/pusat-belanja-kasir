// import { cookies } from "next/headers"

// export async function getCurrentOutletCode() {
//   const cookieStore = await cookies()

//   return Number(
//     cookieStore.get("outlet_code")?.value
//   )
// }

import { cookies } from "next/headers"

export async function getCurrentOutletId() {
  const cookieStore = await cookies()

  return (
    cookieStore.get("outlet_id")?.value ??
    null
  )
}