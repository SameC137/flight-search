import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: [number, number]
  onValueChange?: (value: [number, number]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = [0, 1000], onValueChange, min = 0, max = 1000, step = 10, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState<number>(value[1])

    React.useEffect(() => {
      setLocalValue(value[1])
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      setLocalValue(newValue)
      const newRange: [number, number] = [value[0], newValue]
      onValueChange?.(newRange)
    }

    const minNum = Number(min)
    const maxNum = Number(max)

    return (
      <div className="relative flex w-full items-center">
        <input
          type="range"
          min={minNum}
          max={maxNum}
          step={step}
          value={localValue}
          onChange={handleChange}
          className={cn(
            "h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
