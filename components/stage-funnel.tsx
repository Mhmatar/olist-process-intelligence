'use client'

import { useState } from 'react'
import { STAGE_RAMP, type StagePoint } from '@/lib/schema'

/**
 * A horizontal stacked bar of the three stage medians.
 *
 * Built in plain HTML rather than Recharts: the approval stage is ~0.2% of the
 * total, so the segment is sub-pixel and needs its label placed outside the bar
 * — which a chart library's stacked-label machinery will not do well.
 */
export function StageFunnel({
  stages,
  medianSumDays,
  medianTotalDays,
}: {
  stages: StagePoint[]
  medianSumDays: number
  medianTotalDays: number
}) {
  const [active, setActive] = useState<number | null>(null)

  return (
    <div>
      <div className="relative">
        {/* 24px bar; 2px surface gaps between segments. */}
        <div className="flex h-6 w-full gap-[2px] overflow-hidden rounded-[4px]">
          {stages.map((s, i) => (
            <div
              key={s.key}
              role="img"
              aria-label={`${s.label}: median ${s.medianDisplay}, ${s.sharePct.toFixed(1)}% of the stacked median time`}
              className="h-full min-w-[3px] cursor-default transition-opacity"
              style={{
                width: `${s.sharePct}%`,
                backgroundColor: STAGE_RAMP[i],
                opacity: active === null || active === i ? 1 : 0.45,
              }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </div>

        {active !== null ? (
          <div className="pointer-events-none absolute -top-2 left-0 z-10 -translate-y-full">
            <div className="rounded-md border border-hairline bg-card px-3 py-2 text-xs shadow-md">
              <p className="mb-1.5 font-medium text-card-foreground">
                {stages[active].label}
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Median</span>
                  <span className="font-semibold tabular-nums text-card-foreground">
                    {stages[active].medianDisplay}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Mean</span>
                  <span className="font-semibold tabular-nums text-card-foreground">
                    {stages[active].meanDisplay}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Share of stacked median</span>
                  <span className="font-semibold tabular-nums text-card-foreground">
                    {stages[active].sharePct.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="mt-1.5 border-t border-hairline pt-1.5 text-[11px] text-muted-foreground">
                {stages[active].span}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Per-stage detail in each stage's natural unit — a single linear axis
          cannot serve a sub-hour stage and a multi-day one at once. */}
      <ul className="mt-6 divide-y divide-hairline border-t border-hairline">
        {stages.map((s, i) => (
          <li
            key={s.key}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-card-foreground">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: STAGE_RAMP[i] }}
                aria-hidden="true"
              />
              {s.label}
            </span>
            <span className="flex items-baseline gap-4 text-sm tabular-nums">
              <span className="text-card-foreground">
                <span className="font-semibold">{s.medianDisplay}</span>{' '}
                <span className="text-xs text-muted-foreground">median</span>
              </span>
              <span className="text-muted-foreground">
                {s.meanDisplay} <span className="text-xs">mean</span>
              </span>
              <span className="w-14 text-right text-muted-foreground">
                {s.sharePct.toFixed(1)}%
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground text-pretty">
        <strong className="font-semibold text-card-foreground">
          Medians are not additive.
        </strong>{' '}
        The three stage medians sum to {medianSumDays.toFixed(2)} days, while the
        median end-to-end time is {medianTotalDays.toFixed(2)} days. The bar shows
        each stage&apos;s share of that summed median, not a decomposition of the
        median total. The means <em>do</em> decompose exactly — hover any segment
        to compare.
      </p>
    </div>
  )
}
