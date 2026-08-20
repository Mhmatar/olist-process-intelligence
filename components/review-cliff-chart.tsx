'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BAD_RED, DATA_BLUE, type ReviewPoint } from '@/lib/schema'
import { TooltipRow, TooltipShell } from '@/components/chart-tooltip'

function CliffTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ReviewPoint }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <TooltipShell title={d.label}>
      <TooltipRow
        label="Mean review score"
        value={d.mean.toFixed(3)}
        color={d.bucket === 'on_time' ? DATA_BLUE : BAD_RED}
      />
      <TooltipRow label="Orders" value={d.count.toLocaleString('en-US')} />
      {d.drop !== null ? (
        <TooltipRow label="vs previous bucket" value={d.drop.toFixed(2)} />
      ) : null}
    </TooltipShell>
  )
}

export function ReviewCliffChart({ data }: { data: ReviewPoint[] }) {
  const cliffIndex = data.findIndex((d) => d.isCliff)
  const cliff = cliffIndex >= 0 ? data[cliffIndex] : null
  const prev = cliffIndex > 0 ? data[cliffIndex - 1] : null

  return (
    <div className="h-[340px] w-full sm:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 28, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid stroke="var(--hairline)" strokeWidth={1} vertical={false} />

          {/* Shade the span the score falls across, then name it. */}
          {cliff && prev ? (
            <ReferenceArea
              x1={prev.label}
              x2={cliff.label}
              fill={BAD_RED}
              fillOpacity={0.06}
              stroke="none"
              label={{
                value: `steepest drop: ${cliff.drop!.toFixed(2)} points`,
                position: 'insideTop',
                offset: -20,
                fill: 'var(--muted-foreground)',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          ) : null}

          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--hairline)' }}
            interval={0}
            height={40}
            tickMargin={8}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={44}
            label={{
              value: 'Mean review score',
              angle: -90,
              position: 'insideLeft',
              offset: 20,
              style: {
                fontSize: 11,
                fill: 'var(--muted-foreground)',
                textAnchor: 'middle',
              },
            }}
          />
          <Tooltip content={<CliffTooltip />} cursor={{ fill: 'var(--muted)' }} />
          <Bar dataKey="mean" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              // Red is reserved for the bad end of the scale: every late bucket.
              <Cell key={d.bucket} fill={d.bucket === 'on_time' ? DATA_BLUE : BAD_RED} />
            ))}
            <LabelList
              dataKey="mean"
              position="top"
              offset={8}
              formatter={(v: number) => v.toFixed(2)}
              style={{ fontSize: 12, fontWeight: 600, fill: 'var(--card-foreground)' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
