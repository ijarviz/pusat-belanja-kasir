// lib/utils/format-date.ts

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
]

export function formatDate(
  date: string | Date
) {
  const d = new Date(date)

  return `${String(
    d.getDate()
  ).padStart(2, "0")} ${
    MONTHS[d.getMonth()]
  } ${d.getFullYear()}`
}

export function formatDateShort(
  date: string | Date
) {
  const d = new Date(date)

  return `${String(
    d.getDate()
  ).padStart(2, "0")} ${
    MONTHS[d.getMonth()]
  }`
}

export function formatDateTime(
  date: string | Date
) {
  const d = new Date(date)

  return `${formatDate(d)} ${String(
    d.getHours()
  ).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`
}

export function formatDateKey(
  date: string | Date
) {
  const d = new Date(date)

  const year = d.getFullYear()
  const month = String(
    d.getMonth() + 1
  ).padStart(2, "0")
  const day = String(
    d.getDate()
  ).padStart(2, "0")

  return `${year}-${month}-${day}`
}