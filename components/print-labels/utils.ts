export function maskPhone(hp: string) {
  return hp.length > 3 ? hp.slice(0, -3) + "***" : hp
}

export function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

export const BLACK_CELL = {
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
} as const
