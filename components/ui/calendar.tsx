'use client'

import * as React from "react"
import { format, startOfMonth, getDay, getDaysInMonth, isSameDay, isSameMonth } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type CalendarProps = {
  month?: Date
  onMonthChange?: (month: Date) => void
  selectedDates?: { start?: Date; end?: Date }
  onDateClick?: (date: Date) => void
  datePrices?: Map<string, number>
  currency?: string
  minDate?: Date
  className?: string
}

const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CHF: 'CHF ',
  }
  
  const symbol = currencySymbols[currencyCode] || currencyCode + ' '
  return `${symbol}${amount.toFixed(0)}`
}

export function Calendar({
  month: monthProp,
  onMonthChange,
  selectedDates,
  onDateClick,
  datePrices = new Map(),
  currency = 'USD',
  minDate,
  className,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState(new Date())
  const month = monthProp || internalMonth
  const setMonth = onMonthChange || setInternalMonth

  const daysInMonth = getDaysInMonth(month)
  const firstDayOfMonth = getDay(startOfMonth(month))
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const previousMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
  }

  const handleDateClick = (day: number) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    if (minDate && date < minDate) return
    onDateClick?.(date)
  }

  const getPriceForDate = (day: number): number | null => {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    const dateStr = format(date, 'yyyy-MM-dd')
    return datePrices.get(dateStr) || null
  }

  const isDateInRange = (day: number): boolean => {
    if (!selectedDates?.start && !selectedDates?.end) return false
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    if (selectedDates.start && selectedDates.end) {
      return date >= selectedDates.start && date <= selectedDates.end
    }
    return false
  }

  const isSelectedStart = (day: number): boolean => {
    if (!selectedDates?.start) return false
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    return isSameDay(date, selectedDates.start)
  }

  const isSelectedEnd = (day: number): boolean => {
    if (!selectedDates?.end) return false
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    return isSameDay(date, selectedDates.end)
  }

  const isPastDate = (day: number): boolean => {
    if (!minDate) return false
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    return date < minDate
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={previousMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">
          {format(month, 'MMMM yyyy')}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={nextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground h-8 flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = new Date(month.getFullYear(), month.getMonth(), day)
          const isPast = isPastDate(day)
          const price = getPriceForDate(day)
          const inRange = isDateInRange(day)
          const isStart = isSelectedStart(day)
          const isEnd = isSelectedEnd(day)

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={isPast}
              className={cn(
                "relative aspect-square rounded-md border text-xs transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                isPast && "opacity-50 cursor-not-allowed",
                isStart && "bg-primary text-primary-foreground border-primary",
                isEnd && "bg-primary text-primary-foreground border-primary",
                inRange && !isStart && !isEnd && "bg-primary/20",
                !isPast && !isStart && !isEnd && "cursor-pointer"
              )}
            >
              <div className="flex flex-col items-center justify-center h-full p-1">
                <span className="text-xs font-medium">{day}</span>
                {price !== null && (
                  <span className={cn(
                    "text-[9px] font-semibold mt-0.5",
                    isStart || isEnd
                      ? "text-inherit"
                      : "text-green-600 dark:text-green-400"
                  )}>
                    {formatCurrency(price, currency)}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
