export function formatCurrency(
  amount: number | null | undefined
) {
  if (
    amount === null ||
    amount === undefined
  ) {
    return "Rp 0"
  }

  return `Rp ${Math.round(amount)
    .toString()
    .replace(
      /\B(?=(\d{3})+(?!\d))/g,
      "."
    )}`
}