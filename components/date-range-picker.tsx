"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Props = {
  date: DateRange | undefined
  setDate: (
    date: DateRange | undefined
  ) => void
}

export function DateRangePicker({
  date,
  setDate,
}: Props) {
  const [open, setOpen] = React.useState(false)
  const [tempDate, setTempDate] =
    React.useState<DateRange | undefined>(date)

  React.useEffect(() => {
    setTempDate(date)
  }, [date])

  const [displayMonth, setDisplayMonth] =
    React.useState<Date | undefined>(
        date?.from
    )

    React.useEffect(() => {
    if (open) {
        setDisplayMonth(date?.from)
    }
    }, [open, date])

    const [isMobile, setIsMobile] =
    React.useState(false)

    React.useEffect(() => {
    const checkScreen = () => {
        setIsMobile(window.innerWidth < 1024) // lg
    }

    checkScreen()

    window.addEventListener(
        "resize",
        checkScreen
    )

    return () =>
        window.removeEventListener(
        "resize",
        checkScreen
        )
    }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start text-left font-normal w-[280px]"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />

          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "dd MMM yyyy")}
                {" - "}
                {format(date.to, "dd MMM yyyy")}
              </>
            ) : (
              format(date.from, "dd MMM yyyy")
            )
          ) : (
            "Pilih tanggal"
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        <Calendar
            mode="range"
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            selected={tempDate}
            onSelect={setTempDate}
            numberOfMonths={isMobile ? 1 : 2}
        />

        <div className="border-t p-3 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTempDate(date)
              setOpen(false)
            }}
          >
            Batal
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setDate(tempDate)
              setOpen(false)
            }}
          >
            Terapkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}