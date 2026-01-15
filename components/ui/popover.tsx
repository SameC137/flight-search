import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  children: React.ReactNode
}

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

const Popover = ({ open: controlledOpen, onOpenChange, children }: PopoverProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [controlledOpen, onOpenChange]
  )

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild, className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(PopoverContext)

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ref,
        onClick: (e: React.MouseEvent) => {
          setOpen(!open)
          props.onClick?.(e)
        },
      } as any)
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", side = "bottom", children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(PopoverContext)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const triggerRef = React.useRef<HTMLElement | null>(null)

    React.useImperativeHandle(ref, () => contentRef.current!)

    React.useEffect(() => {
      if (!open) return

      // Find the trigger element
      if (contentRef.current) {
        const parent = contentRef.current.parentElement
        if (parent) {
          triggerRef.current = parent.querySelector('input, button') as HTMLElement
        }
      }

      const handleClickOutside = (event: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
            setOpen(false)
          }
        }
      }

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)

      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleEscape)
      }
    }, [open, setOpen])

    if (!open) return null

    const alignClasses = {
      start: "left-0",
      center: "left-1/2 -translate-x-1/2",
      end: "right-0",
    }

    const sideClasses = {
      top: "bottom-full mb-2",
      right: "left-full ml-2 top-0",
      bottom: "top-full mt-2",
      left: "right-full mr-2 top-0",
    }

    return (
      <div
        ref={contentRef}
        className={cn(
          "absolute z-50 rounded-md border bg-popover text-popover-foreground shadow-md",
          alignClasses[align],
          sideClasses[side],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
