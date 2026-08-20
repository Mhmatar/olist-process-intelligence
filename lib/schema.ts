/**
 * Types, tokens and thresholds shared by server aggregation and client charts.
 *
 * Deliberately free of `node:fs` and `server-only` so client components can
 * import a colour or a label without dragging the CSV reader into the bundle.
 * All CSV reading lives in lib/data.ts.
 */

/**
 * Exclusion counts behind the clean case set.
 *
 * CLAUDE.md names VERIFICATION.md as the authority on the exclusion logic, but
 * that file is not in the repo. These figures are transcribed from CLAUDE.md's
 * own restatement of it — they are NOT re-derived here, and cannot be: the raw
 * Olist tables are absent, so the exclusions can't be re-run. If VERIFICATION.md
 * lands later, reconcile these against it.
 */
export const EXCLUSIONS = {
  deliveredNoTimestamp: 8,
  outOfOrderTimestamps: 1373,
  negativeTransit: 23,
} as const

export const EXCLUDED_TOTAL =
  EXCLUSIONS.deliveredNoTimestamp +
  EXCLUSIONS.outOfOrderTimestamps +
  EXCLUSIONS.negativeTransit // 1,404

// Data marks. One accent for data; red is reserved for "bad" values only.
export const DATA_BLUE = '#2a78d6'
export const BAD_RED = '#c8384a'
export const GOOD_GREEN = '#1f9254'
export const NEUTRAL_GRAY = '#898781'

/**
 * Sequential ramp on the accent hue, light → dark, for the three process stages.
 * The stages are ordered in time, so one hue stepped by lightness reads as
 * progression and keeps the palette to a single accent.
 */
export const STAGE_RAMP = ['#a9cdf0', '#5b99e0', '#2a78d6'] as const

/** A seller above this average approval→carrier time is flagged as an outlier. */
export const SELLER_OUTLIER_H = 200

/** Monthly rows with fewer than this many orders are noise — see CLAUDE.md. */
export const MIN_MONTH_ORDERS = 30

export const DELAY_BUCKETS = [
  'on_time',
  'late_1_3d',
  'late_4_7d',
  'late_8_14d',
  'late_15d_plus',
] as const

export type DelayBucket = (typeof DELAY_BUCKETS)[number]

export const BUCKET_LABELS: Record<DelayBucket, string> = {
  on_time: 'On time / early',
  late_1_3d: '1–3 days late',
  late_4_7d: '4–7 days late',
  late_8_14d: '8–14 days late',
  late_15d_plus: '15+ days late',
}

export type Case = {
  orderId: string
  state: string
  purchase: string
  delivered: string
  estimated: string
  approvalH: number
  carrierH: number
  transitDays: number
  totalDays: number
  late: boolean
  delayDays: number
  bucket: DelayBucket
  reviewScore: number | null
}

export type Kpis = {
  cases: number
  candidates: number
  excluded: number
  retentionPct: number
  lateCount: number
  lateRatePct: number
  medianTotalDays: number
  reviewOnTime: number
  reviewWorst: number
  reviewDropPct: number
}

export type ReviewPoint = {
  bucket: DelayBucket
  label: string
  mean: number
  count: number
  /** Change in mean score vs the preceding bucket; null for the first. */
  drop: number | null
  isCliff: boolean
}

export type StagePoint = {
  key: 'approval' | 'carrier' | 'transit'
  label: string
  span: string
  medianH: number
  meanH: number
  /** Share of the summed medians — the funnel proportion. */
  sharePct: number
  /** Pre-formatted in the stage's natural unit (hours vs days). */
  medianDisplay: string
  meanDisplay: string
}

export type Seller = {
  rank: number
  sellerId: string
  orders: number
  avgCarrierH: number
  avgCarrierDays: number
  isOutlier: boolean
}

export type StatePoint = {
  state: string
  orders: number
  lateCount: number
  lateRatePct: number
  avgTotalDays: number
  group: 'worst' | 'best'
}

export type MonthPoint = {
  month: string
  label: string
  orders: number
  /** Null where the month is absent from the data or dropped as noise, so the
   *  trend lines break visibly instead of interpolating across a real gap. */
  lateRatePct: number | null
  medianTotalDays: number | null
}

export type Dashboard = {
  kpis: Kpis
  review: ReviewPoint[]
  stages: StagePoint[]
  stageMedianSumDays: number
  sellers: Seller[]
  sellerTotal: number
  states: StatePoint[]
  stateCount: number
  allStates: string[]
  months: MonthPoint[]
  excludedMonths: { month: string; orders: number }[]
  purchaseSpan: { from: string; to: string }
  missingReviews: number
}
