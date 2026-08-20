import type { ReactNode } from 'react'

export function SectionCard({
  title,
  description,
  action,
  footnote,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  footnote?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-hairline bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-card-foreground text-balance">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
      {footnote ? (
        <p className="mt-4 border-t border-hairline pt-3 text-xs leading-relaxed text-muted-foreground text-pretty">
          {footnote}
        </p>
      ) : null}
    </section>
  )
}
