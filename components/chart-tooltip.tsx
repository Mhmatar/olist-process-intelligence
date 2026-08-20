import type { ReactNode } from 'react'

/** Shared tooltip shell so every chart's hover surface looks identical. */
export function TooltipShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-md border border-hairline bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-card-foreground">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

export function TooltipRow({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {color ? (
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        ) : null}
        {label}
      </span>
      <span className="font-semibold tabular-nums text-card-foreground">{value}</span>
    </div>
  )
}
