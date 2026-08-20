'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BAD_RED, DATA_BLUE, type MonthPoint } from '@/lib/schema'
import { TooltipRow, TooltipShell } from '@/components/chart-tooltip'

/**
 * Two stacked single-axis charts rather than one dual-axis chart: a percentage
 * and a day count share no scale, and overlaying them would let the crossing
 * point imply a relationship that the axes invented.
 */
function TrendTooltip({
  active,
  payload,
  label,
  metric,
  unit,
  color,
}: {
  active?: boolean
  payload?: Array<{ payload: MonthPoint; value: number | null }>
  label?: string
  metric: string
  unit: string
  color: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const value = payload[0].value
  if (value === null || value === undefined) return null
  return (
    <TooltipShell title={label ?? ''}>
      <TooltipRow label={metric} value={`${value.toFixed(unit === '%' ? 1 : 2)}${unit === '%' ? '%' : ` ${unit}`}`} color={color} />
      <TooltipRow label="Orders" value={d.orders.toLocaleString('en-US')} />
    </TooltipShell>
  )
}

/**
 * Renders a dot only where a point has no drawn neighbour. Oct 2016 is stranded
 * between a missing Nov 2016 and the dropped Dec 2016, so with a line-only mark
 * its 261 orders would draw nothing at all.
 */
function IsolatedDot(props: {
  cx?: number
  cy?: number
  index?: number
  points?: Array<{ value: number | null }>
  fill?: string
}) {
  const { cx, cy, index, points, fill } = props
  if (cx == null || cy == null || index == null || !points) return null
  const has = (i: number) => points[i]?.value != null
  if (has(index - 1) || has(index + 1)) return null
  return <circle cx={cx} cy={cy} r={3} fill={fill} />
}

function TrendChart({
  data,
  dataKey,
  color,
  metric,
  unit,
  formatTick,
}: {
  data: MonthPoint[]
  dataKey: 'lateRatePct' | 'medianTotalDays'
  color: string
  metric: string
  unit: string
  formatTick: (v: number) => string
}) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid stroke="var(--hairline)" strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--hairline)' }}
            interval={2}
            height={28}
            tickMargin={8}
          />
          {/* No rotated axis title — the heading above already names the metric
              and its unit, and a vertical label collides with the ticks. */}
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={formatTick}
          />
          <Tooltip
            content={<TrendTooltip metric={metric} unit={unit} color={color} />}
            cursor={{ stroke: 'var(--hairline)', strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={<IsolatedDot fill={color} />}
            activeDot={{ r: 4 }}
            /* Left false so the Nov 2016 hole reads as a break, not a trend. */
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MonthlyTrend({ months }: { months: MonthPoint[] }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-card-foreground">
          Late rate <span className="font-normal text-muted-foreground">(% of orders)</span>
        </h3>
        <TrendChart
          data={months}
          dataKey="lateRatePct"
          color={BAD_RED}
          metric="Late rate"
          unit="%"
          formatTick={(v) => `${v}%`}
        />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-card-foreground">
          Median total delivery time{' '}
          <span className="font-normal text-muted-foreground">
            (days, purchase → delivery)
          </span>
        </h3>
        <TrendChart
          data={months}
          dataKey="medianTotalDays"
          color={DATA_BLUE}
          metric="Median delivery"
          unit="days"
          formatTick={(v) => `${v}`}
        />
      </div>
    </div>
  )
}
