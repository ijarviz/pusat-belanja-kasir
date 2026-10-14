export async function fetchUserOutlets(
  supabase: any,
  userId: string
) {
  const { data, error } = await supabase
    .from("outlet_users")
    .select(`
      role,
      status,
      outlets (
        id,
        code,
        name,
        plan,
        image_url,
        address,
        url,
        status
      )
    `)
    .eq("user_id", userId)

  if (error) {
    console.error(
      "fetchUserOutlets error:",
      error
    )

    return []
  }

  if (!data) return []

  return data
    .filter(
      (row: any) =>
        row?.status === "active" &&
        row?.outlets?.status === "active"
    )
    .map((row: any) => ({
      ...row.outlets,
      role: row.role,
      membershipStatus: row.status,
    }))
    .filter(
      (outlet: any) =>
        outlet !== null &&
        outlet !== undefined
    )
}