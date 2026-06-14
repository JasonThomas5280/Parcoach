import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** A large, warm, thumb-reachable button for the parent surface. */
export function BigButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}) {
  const base =
    'inline-flex items-center justify-center gap-3 rounded-soft px-7 py-4 text-lg font-medium transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 min-h-[56px]'
  const styles: Record<string, string> = {
    primary: 'bg-subject-pop text-white shadow-sm hover:brightness-105',
    secondary: 'bg-warm-deep text-ink hover:brightness-[0.98]',
    ghost: 'bg-transparent text-ink-soft hover:text-ink',
  }
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

/** A calm content card for the parent dashboard / settings. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-soft bg-white/60 p-5 shadow-[0_1px_3px_rgba(43,42,38,0.06)] ring-1 ring-black/[0.03] ${className}`}
    >
      {children}
    </div>
  )
}

/** A single honest "point" stat for the parent. */
export function Stat({
  value,
  label,
}: {
  value: number | string
  label: string
}) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-3xl text-ink">{value}</span>
      <span className="text-sm text-ink-soft">{label}</span>
    </div>
  )
}
