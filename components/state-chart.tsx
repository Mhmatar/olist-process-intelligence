'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BAD_RED, DATA_BLUE, type StatePoint } from '@/lib/schema'
import { TooltipRow, TooltipShell } from '@/components/chart-tooltip'

function StateTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: StatePoint }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <TooltipShell title={d.state}>
      <TooltipRow
        label="Late rate"
        value={`${d.lateRatePct.toFixed(2)}%`}
        color={d.group === 'worst' ? BAD_RED : DATA_BLUE}
      />
      <TooltipRow
        label="Late / total orders"
        value={`${d.lateCount.toLocaleString('en-US')} / ${d.orders.toLocaleString('en-US')}`}
      />
      <TooltipRow label="Avg delivery time" value={`${d.avgTotalDays.toFixed(1)} days`} />
    </TooltipShell>
  )
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}

export function StateChart({ states }: { states: StatePoint[] }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        <Swatch color={BAD_RED} label="Worst 10 by late rate" />
        <Swatch color={DATA_BLUE} label="Best 5 by late rate" />
      </div>

      <div className="h-[520px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={states}
            layout="vertical"
            margin={{ top: 4, right: 44, bottom: 8, left: 4 }}
            barCategoryGap={6}
          >
            <CartesianGrid stroke="var(--hairline)" strokeWidth={1} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--hairline)' }}
              tickFormatter={(v: number) => `${v}%`}
              height={28}
            />
            <YAxis
              type="category"
              dataKey="state"
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              width={44}
              interval={0}
            />
            <Tooltip content={<StateTooltip />} cursor={{ fill: 'var(--muted)' }} />
            <Bar
              dataKey="lateRatePct"
              maxBarSize={24}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            >
              {states.map((s) => (
                <Cell
                  key={s.state}
                  fill={s.group === 'worst' ? BAD_RED : DATA_BLUE}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
