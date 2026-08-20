import 'server-only'

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { cache } from 'react'
import {
  BUCKET_LABELS,
  DELAY_BUCKETS,
  EXCLUDED_TOTAL,
  MIN_MONTH_ORDERS,
  SELLER_OUTLIER_H,
  type Case,
  type Dashboard,
  type DelayBucket,
  type Kpis,
  type MonthPoint,
  type ReviewPoint,
  type Seller,
  type StagePoint,
  type StatePoint,
} from '@/lib/schema'

const DATA_DIR = path.join(process.cwd(), 'data')

// ---------------------------------------------------------------------------
// CSV reading
// ---------------------------------------------------------------------------

/**
 * The four files in data/ are pipeline outputs with a fixed, quote-free schema
 * (hex ids, 2-letter state codes, ISO timestamps, numbers, booleans). A split on
 * commas is sufficient; the field-count guard catches it if that ever stops
 * being true rather than silently mis-parsing.
 */
function readCsv(file: string): Record<string, string>[] {
  const text = readFileSync(path.join(DATA_DIR, file), 'utf8')
  const lines = text.split('\n')
  const header = lines[0].trim().split(',')
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line || !line.trim()) continue
    const parts = line.trim().split(',')
    if (parts.length !== header.length) {
      throw new Error(
        `${file}: line ${i + 1} has ${parts.length} fields, expected ${header.length}. ` +
          `The quote-free assumption in readCsv no longer holds.`,
      )
    }
    const row: Record<string, string> = {}
    for (let j = 0; j < header.length; j++) row[header[j]] = parts[j]
    rows.push(row)
  }
  return rows
}

function medianOf(values: number[]): number {
  if (values.length === 0) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

function mean(values: number[]): number {
  if (values.length === 0) return NaN
  let sum = 0
  for (const v of values) sum += v
  return sum / values.length
}

// ---------------------------------------------------------------------------
// The fact table
// ---------------------------------------------------------------------------

/**
 * Parses all 95,082 cases once per process. Cached because both the dashboard
 * render and the /api/cases pagination route need it.
 */
export const getCases = cache((): Case[] => {
  return readCsv('olist_cases_clean.csv').map((r) => ({
    orderId: r.order_id,
    state: r.customer_state,
    purchase: r.order_purchase_timestamp,
    delivered: r.order_delivered_customer_date,
    estimated: r.order_estimated_delivery_date,
    approvalH: Number(r.approval_h),
    carrierH: Number(r.carrier_h),
    transitDays: Number(r.transit_days),
    totalDays: Number(r.total_days),
    late: r.late === 'True',
    delayDays: Number(r.delay_days),
    bucket: r.delay_bucket as DelayBucket,
    reviewScore: r.review_score === '' ? null : Number(r.review_score),
  }))
})

// ---------------------------------------------------------------------------
// Aggregates
// ---------------------------------------------------------------------------

function buildReview(): ReviewPoint[] {
  const rows = readCsv('olist_review_by_delay.csv')
  const byBucket = new Map(rows.map((r) => [r.delay_bucket, r]))

  const points = DELAY_BUCKETS.map((bucket, i) => {
    const row = byBucket.get(bucket)
    if (!row) throw new Error(`olist_review_by_delay.csv is missing "${bucket}"`)
    const value = Number(row.mean)
    const prev = i === 0 ? null : Number(byBucket.get(DELAY_BUCKETS[i - 1])!.mean)
    return {
      bucket,
      label: BUCKET_LABELS[bucket],
      mean: value,
      count: Number(row.count),
      drop: prev === null ? null : value - prev,
      isCliff: false,
    }
  })

  // Mark the steepest bucket-to-bucket fall rather than hardcoding which one it
  // is, so the annotation follows the data if the rollup is ever regenerated.
  let steepest = -1
  let steepestDrop = 0
  points.forEach((p, i) => {
    if (p.drop !== null && p.drop < steepestDrop) {
      steepestDrop = p.drop
      steepest = i
    }
  })
  if (steepest >= 0) points[steepest].isCliff = true

  return points
}

function buildStages(cases: Case[]): {
  stages: StagePoint[]
  stageMedianSumDays: number
} {
  const specs = [
    {
      key: 'approval' as const,
      label: 'Purchase → approval',
      span: 'order_purchase_timestamp → order_approved_at',
      values: cases.map((c) => c.approvalH),
      unit: 'h' as const,
    },
    {
      key: 'carrier' as const,
      label: 'Approval → carrier handoff',
      span: 'order_approved_at → order_delivered_carrier_date',
      values: cases.map((c) => c.carrierH),
      unit: 'h' as const,
    },
    {
      key: 'transit' as const,
      label: 'Carrier → customer transit',
      span: 'order_delivered_carrier_date → order_delivered_customer_date',
      values: cases.map((c) => c.transitDays * 24),
      unit: 'd' as const,
    },
  ]

  const medians = specs.map((s) => medianOf(s.values))
  const sumMedians = medians.reduce((a, b) => a + b, 0)

  const fmt = (hours: number, unit: 'h' | 'd') =>
    unit === 'h' ? `${hours.toFixed(1)} h` : `${(hours / 24).toFixed(2)} d`

  const stages = specs.map((s, i) => ({
    key: s.key,
    label: s.label,
    span: s.span,
    medianH: medians[i],
    meanH: mean(s.values),
    sharePct: (medians[i] / sumMedians) * 100,
    medianDisplay: fmt(medians[i], s.unit),
    meanDisplay: fmt(mean(s.values), s.unit),
  }))

  return { stages, stageMedianSumDays: sumMedians / 24 }
}

function buildStates(cases: Case[]): {
  states: StatePoint[]
  stateCount: number
  allStates: string[]
} {
  const agg = new Map<string, { orders: number; late: number; totalDays: number }>()
  for (const c of cases) {
    let a = agg.get(c.state)
    if (!a) {
      a = { orders: 0, late: 0, totalDays: 0 }
      agg.set(c.state, a)
    }
    a.orders++
    if (c.late) a.late++
    a.totalDays += c.totalDays
  }

  const all = [...agg.entries()]
    .map(([state, a]) => ({
      state,
      orders: a.orders,
      lateCount: a.late,
      lateRatePct: (a.late / a.orders) * 100,
      avgTotalDays: a.totalDays / a.orders,
    }))
    .sort((x, y) => y.lateRatePct - x.lateRatePct)

  const worst: StatePoint[] = all.slice(0, 10).map((s) => ({ ...s, group: 'worst' }))
  const best: StatePoint[] = all
    .slice(-5)
    .reverse()
    .map((s) => ({ ...s, group: 'best' }))

  return {
    states: [...worst, ...best],
    stateCount: all.length,
    allStates: all.map((s) => s.state).sort(),
  }
}

/** Inclusive list of "YYYY-MM" strings from `from` to `to`. */
function monthSequence(from: string, to: string): string[] {
  const out: string[] = []
  let [y, m] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return out
}

function formatMonth(iso: string): string {
  const [y, m] = iso.split('-')
  const name = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ][Number(m) - 1]
  return `${name} ${y}`
}

function buildMonths(cases: Case[]): {
  months: MonthPoint[]
  excludedMonths: { month: string; orders: number }[]
} {
  // olist_monthly_stages.csv supplies late_rate; median total days is not in
  // that rollup (it carries means), so it is computed from the fact table here.
  // Both are keyed on purchase month — verified: the per-month case counts match
  // the rollup's `orders` column exactly.
  const rollup = readCsv('olist_monthly_stages.csv')

  const totalsByMonth = new Map<string, number[]>()
  for (const c of cases) {
    const m = c.purchase.slice(0, 7)
    const list = totalsByMonth.get(m)
    if (list) list.push(c.totalDays)
    else totalsByMonth.set(m, [c.totalDays])
  }

  const byMonth = new Map(rollup.map((r) => [r.month, r]))
  const present = rollup.map((r) => r.month).sort()
  const excludedMonths: { month: string; orders: number }[] = []

  // Walk a continuous month sequence rather than the rollup's own rows: Nov 2016
  // has no records at all, and a categorical axis built from present months only
  // would equal-space that three-month hole as if it were one step.
  const months: MonthPoint[] = []
  for (const month of monthSequence(present[0], present[present.length - 1])) {
    const row = byMonth.get(month)
    const orders = row ? Number(row.orders) : 0

    if (row && orders < MIN_MONTH_ORDERS) {
      excludedMonths.push({ month, orders })
    }

    const usable = row !== undefined && orders >= MIN_MONTH_ORDERS
    months.push({
      month,
      label: formatMonth(month),
      orders,
      lateRatePct: usable ? Number(row!.late_rate) * 100 : null,
      medianTotalDays: usable ? medianOf(totalsByMonth.get(month) ?? []) : null,
    })
  }

  return { months, excludedMonths }
}

export const getDashboard = cache((): Dashboard => {
  const cases = getCases()

  const review = buildReview()
  const onTime = review[0]
  const worstBucket = review[review.length - 1]

  const lateCount = cases.reduce((n, c) => n + (c.late ? 1 : 0), 0)
  const medianTotalDays = medianOf(cases.map((c) => c.totalDays))
  const candidates = cases.length + EXCLUDED_TOTAL

  const kpis: Kpis = {
    cases: cases.length,
    candidates,
    excluded: EXCLUDED_TOTAL,
    retentionPct: (cases.length / candidates) * 100,
    lateCount,
    lateRatePct: (lateCount / cases.length) * 100,
    medianTotalDays,
    reviewOnTime: onTime.mean,
    reviewWorst: worstBucket.mean,
    reviewDropPct: ((onTime.mean - worstBucket.mean) / onTime.mean) * 100,
  }

  const { stages, stageMedianSumDays } = buildStages(cases)
  const { states, stateCount, allStates } = buildStates(cases)
  const { months, excludedMonths } = buildMonths(cases)

  const sellerRows = readCsv('olist_seller_bottlenecks.csv')
  const sellers: Seller[] = sellerRows.slice(0, 15).map((r, i) => {
    const h = Number(r.avg_carrier_h)
    return {
      rank: i + 1,
      sellerId: r.seller_id,
      orders: Number(r.orders),
      avgCarrierH: h,
      avgCarrierDays: h / 24,
      isOutlier: h > SELLER_OUTLIER_H,
    }
  })

  const purchases = cases.map((c) => c.purchase).sort()

  return {
    kpis,
    review,
    stages,
    stageMedianSumDays,
    sellers,
    sellerTotal: sellerRows.length,
    states,
    stateCount,
    allStates,
    months,
    excludedMonths,
    purchaseSpan: {
      from: purchases[0].slice(0, 10),
      to: purchases[purchases.length - 1].slice(0, 10),
    },
    missingReviews: cases.reduce((n, c) => n + (c.reviewScore === null ? 1 : 0), 0),
  }
})
