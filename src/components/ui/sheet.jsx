import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sheet({ open, onOpenChange, children }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => onOpenChange?.(false)}
        />
      )}
      {children}
    </>
  )
}

export function SheetContent({ open, onOpenChange, side = 'right', className, children }) {
  if (!open) return null

  const sideClasses = {
    right: 'inset-y-0 right-0 h-full w-full max-w-md border-l',
    left: 'inset-y-0 left-0 h-full w-full max-w-md border-r',
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col bg-background shadow-lg transition-transform overflow-hidden',
        sideClasses[side],
        className
      )}
    >
      <button
        type="button"
        onClick={() => onOpenChange?.(false)}
        className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring z-10"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
      {children}
    </div>
  )
}

export function SheetHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-2 p-6 pb-0', className)} {...props} />
}

export function SheetTitle({ className, ...props }) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />
}

export function SheetBody({ className, ...props }) {
  return <div className={cn('flex-1 overflow-y-auto p-6', className)} {...props} />
}
