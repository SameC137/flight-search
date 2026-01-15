import * as React from "react"
import { cn } from "@/lib/utils"

interface CommandProps {
  children: React.ReactNode
  className?: string
}

interface CommandInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
}

interface CommandListProps {
  children: React.ReactNode
  className?: string
}

interface CommandEmptyProps {
  children: React.ReactNode
}

interface CommandGroupProps {
  children: React.ReactNode
  heading?: string
}

interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  onSelect?: () => void
}

const Command = ({ children, className }: CommandProps) => {
  return (
    <div className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className)}>
      {children}
    </div>
  )
}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, placeholder = "Search...", value, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onValueChange) {
        onValueChange(e.target.value)
      }
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <div className="flex items-center border-b px-3">
        <input
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          {...props}
        />
      </div>
    )
  }
)
CommandInput.displayName = "CommandInput"

const CommandList = ({ children, className }: CommandListProps) => {
  return (
    <div className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}>
      {children}
    </div>
  )
}

const CommandEmpty = ({ children }: CommandEmptyProps) => {
  return <div className="py-6 text-center text-sm text-muted-foreground">{children}</div>
}

const CommandGroup = ({ children, heading }: CommandGroupProps) => {
  return (
    <div className="overflow-hidden p-1">
      {heading && (
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          {heading}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  )
}

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ className, onSelect, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground",
          className
        )}
        onClick={onSelect}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CommandItem.displayName = "CommandItem"

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem }
