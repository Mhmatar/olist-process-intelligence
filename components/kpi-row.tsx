import type { Kpis } from '@/lib/schema'

function Kpi({
  label,
  value,
  unit,
  detail,
  tone = 'neutral',
}: {
  label: string
  value: string
  unit?: string
  detail: string
  tone?: 'neutral' | 'bad'
}) {
  return (
    <div className="rounded-lg border border-hairline bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`text-3xl font-semibold tabular-nums tracking-tight ${
            tone === 'bad' ? 'text-bad' : 'text-card-foreground'
          }`}
        >
          {value}
        </span>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground text-pretty">
        {detail}
      </p>
    </div>
  )
}

export function KpiRow({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        label="Clean case set"
        value={kpis.cases.toLocaleString('en-US')}
        unit="orders"
        detail={`${kpis.retentionPct.toFixed(1)}% of the ${kpis.candidates.toLocaleString(
          'en-US',
        )} delivered orders retained; ${kpis.excluded.toLocaleString('en-US')} excluded for broken timestamps.`}
      />
      <Kpi
        label="Late deliveries"
        value={`${kpis.lateRatePct.toFixed(1)}%`}
        tone="bad"
        detail={`${kpis.lateCount.toLocaleString('en-US')} orders arrived after their estimated delivery date.`}
      />
      <Kpi
        label="Median delivery time"
        value={kpis.medianTotalDays.toFixed(1)}
        unit="days"
        detail="Purchase to customer delivery, across all three process stages."
      />
      <Kpi
        label="Review score cliff"
        value={`${kpis.reviewOnTime.toFixed(2)} → ${kpis.reviewWorst.toFixed(2)}`}
        detail={`Mean review score, on-time versus 15+ days late — a ${kpis.reviewDropPct.toFixed(
          0,
        )}% fall.`}
        tone="neutral"
      />
    </div>
  )
}
