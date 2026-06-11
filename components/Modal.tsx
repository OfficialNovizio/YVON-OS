'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!open) return null
  const max = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${max} rounded-2xl border border-white/10 bg-surface-container shadow-2xl`}>
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 border-b border-white/8 p-4">
            <div>
              {title && <h3 className="text-base font-semibold text-on-surface">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-[12px] text-on-surface-variant">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="btn-ghost !p-2">
              <X size={15} />
            </button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto p-4 scroll-y">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-white/8 p-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-surface-container shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/8 p-4">
          <h3 className="text-base font-semibold text-on-surface">{title}</h3>
          <button onClick={onClose} className="btn-ghost !p-2">
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 scroll-y">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-white/8 p-4">{footer}</div>}
      </div>
    </div>
  )
}
