import { CircleCheck, Github } from 'lucide-react'
import { getDashboard } from '@/lib/data'
import {
  EXCLUSIONS,
  SELLER_OUTLIER_H,
  MIN_MONTH_ORDERS,
} from '@/lib/schema'
import { KpiRow } from '@/components/kpi-row'
import { SectionCard } from '@/components/section-card'
import { ReviewCliffChart } from '@/components/review-cliff-chart'
import { StageFunnel } from '@/components/stage-funnel'
import { SellerTable } from '@/components/seller-table'
import { StateChart } from '@/components/state-chart'
import { MonthlyTrend } from '@/components/monthly-trend'
import { RawCaseTable } from '@/components/raw-case-table'

const KAGGLE_URL = 'https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce'
const LICENSE_URL = 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
const GITHUB_URL = 'https://github.com/Mhmatar/olist-process-intelligence'

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  const month = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ][Number(m) - 1]
  return `${month} ${Number(d)}, ${y}`
}

export default function Page() {
  const d = getDashboard()
  const { kpis } = d

  const cliff = d.review.find((r) => r.isCliff)
  const cliffPrev = cliff
    ? d.review[d.review.findIndex((r) => r.isCliff) - 1]
    : null
  const reviewTotal = d.review.reduce((n, r) => n + r.count, 0)

  const worst = d.states.filter((s) => s.group === 'worst')
  const best = d.states.filter((s) => s.group === 'best')
  const bestAvgDays = best.reduce((n, s) => n + s.avgTotalDays, 0) / best.length
  const worstState = worst[0]
  const smallSamples = best.filter((s) => s.orders < 100)

  const outliers = d.sellers.filter((s) => s.isOutlier).length
  const trendMonths = d.months.filter((m) => m.lateRatePct !== null)
  const firstTrend = trendMonths[0]
  const lastTrend = trendMonths[trendMonths.length - 1]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 border-b border-hairline pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-data">
            Process mining · Olist Brazilian e-commerce
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            Olist Order Process Intelligence
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
            Every delivered order is one case, decomposed into three stages
            between purchase and delivery. Two questions: which stage causes late
            deliveries, and what does lateness cost in customer satisfaction?
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-data/30 bg-data/10 px-3 py-1 text-xs font-medium text-data">
            <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {kpis.cases.toLocaleString('en-US')} cases ·{' '}
            {fmtDate(d.purchaseSpan.from)} – {fmtDate(d.purchaseSpan.to)}
          </span>
        </header>

        <main className="space-y-6">
          <KpiRow kpis={kpis} />

          <SectionCard
            title="The review cliff"
            description={
              cliff && cliffPrev
                ? `Mean review score by how late the order arrived. Satisfaction does not decay gently — it falls ${Math.abs(
                    cliff.drop!,
                  ).toFixed(2)} points between "${cliffPrev.label}" and "${cliff.label}", the steepest step on the scale.`
                : 'Mean review score by how late the order arrived.'
            }
            footnote={
              <>
                Source: <code>olist_review_by_delay.csv</code>. Covers{' '}
                {reviewTotal.toLocaleString('en-US')} cases — the{' '}
                {d.missingReviews.toLocaleString('en-US')} cases with no review
                score are dropped, so these counts sit slightly below the case
                table&apos;s. The <em>on time / early</em> bucket absorbs all
                early deliveries, which is the large majority.
              </>
            }
          >
            <ReviewCliffChart data={d.review} />
          </SectionCard>

          <SectionCard
            title="Where does the time go"
            description="The three stages of one order's lifecycle. Approval is effectively instant; the carrier handoff is where sellers control the clock, and transit is the bulk of it."
            footnote={
              <>
                Computed from <code>olist_cases_clean.csv</code> over all{' '}
                {kpis.cases.toLocaleString('en-US')} cases. Stage spans are
                defined in the methodology note below; each stage is shown in its
                natural unit because a sub-hour stage and a multi-day stage cannot
                share a linear axis.
              </>
            }
          >
            <StageFunnel
              stages={d.stages}
              medianSumDays={d.stageMedianSumDays}
              medianTotalDays={kpis.medianTotalDays}
            />
          </SectionCard>

          <SectionCard
            title="Worst-offending sellers"
            description={`The ${d.sellers.length} slowest sellers by average approval → carrier handoff — the one stage attributable to the seller rather than the logistics network. ${outliers} of them sit above the ${SELLER_OUTLIER_H} h threshold.`}
            footnote={
              <>
                Source: <code>olist_seller_bottlenecks.csv</code>, which ranks{' '}
                {d.sellerTotal.toLocaleString('en-US')} sellers filtered to those
                with at least 20 orders. Seller ids are truncated for display;
                they are anonymised in the source dataset. A high average here is
                not proof of fault — order mix and product type are not controlled
                for.
              </>
            }
          >
            <SellerTable sellers={d.sellers} />
          </SectionCard>

          <SectionCard
            title="Late rate by customer state"
            description={`The 10 worst and 5 best of ${d.stateCount} customer states. ${worstState.state} runs ${(
              worstState.lateRatePct / kpis.lateRatePct
            ).toFixed(1)}× the national late rate of ${kpis.lateRatePct.toFixed(1)}%.`}
            footnote={
              <>
                Derived from <code>olist_cases_clean.csv</code> — note there is no{' '}
                <code>olist_by_state.csv</code> in <code>data/</code>, so these
                figures are aggregated from the fact table directly.{' '}
                <strong className="font-semibold text-card-foreground">
                  Read the &ldquo;best&rdquo; five with care:
                </strong>{' '}
                they average {bestAvgDays.toFixed(1)} days to deliver, well above
                the national median of {kpis.medianTotalDays.toFixed(1)} days. They
                score well because their estimated dates are padded, not because
                they are fast.{' '}
                {smallSamples.length > 0 ? (
                  <>
                    {smallSamples.length === 1 ? 'One of them' : `${smallSamples.length} of them`}{' '}
                    (
                    {smallSamples
                      .map((s) => `${s.state}, n=${s.orders}`)
                      .join('; ')}
                    ) also rest{smallSamples.length === 1 ? 's' : ''} on a small
                    sample.
                  </>
                ) : null}
              </>
            }
          >
            <StateChart states={d.states} />
          </SectionCard>

          <SectionCard
            title="Monthly trend"
            description={`Late rate and median delivery time by purchase month, ${firstTrend.label} – ${lastTrend.label}. Shown as two charts on separate axes rather than one dual-axis chart, so neither line's shape distorts the other.`}
            footnote={
              <>
                Late rate from <code>olist_monthly_stages.csv</code>; median total
                days computed from <code>olist_cases_clean.csv</code> (the rollup
                carries means, not medians). Months with fewer than{' '}
                {MIN_MONTH_ORDERS} orders are dropped as noise —{' '}
                {d.excludedMonths
                  .map((m) => `${m.month} (n=${m.orders})`)
                  .join(', ')}
                . November 2016 has no records at all; the lines break at each gap
                rather than interpolating across it.
              </>
            }
          >
            <MonthlyTrend months={d.months} />
          </SectionCard>

          <RawCaseTable states={d.allStates} totalCases={kpis.cases} />
        </main>

        <footer className="mt-10 space-y-4 border-t border-hairline pt-6 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Data &amp; methodology
          </h2>
          <ul className="space-y-2">
            {[
              <>
                <strong className="font-semibold text-card-foreground">
                  The case set.
                </strong>{' '}
                {kpis.cases.toLocaleString('en-US')} delivered orders, one row per
                case, purchased between {fmtDate(d.purchaseSpan.from)} and{' '}
                {fmtDate(d.purchaseSpan.to)} across {d.stateCount} customer states.
              </>,
              <>
                <strong className="font-semibold text-card-foreground">
                  Exclusions.
                </strong>{' '}
                {kpis.excluded.toLocaleString('en-US')} rows were removed from the{' '}
                {kpis.candidates.toLocaleString('en-US')} delivered orders by an
                offline verification pass:{' '}
                {EXCLUSIONS.deliveredNoTimestamp} marked delivered with no delivery
                timestamp, {EXCLUSIONS.outOfOrderTimestamps.toLocaleString('en-US')}{' '}
                with out-of-order timestamps, and {EXCLUSIONS.negativeTransit} with
                negative transit — leaving {kpis.retentionPct.toFixed(1)}% of the
                delivered pool.
              </>,
              <>
                <strong className="font-semibold text-card-foreground">
                  The stage model.
                </strong>{' '}
                Approval = purchase → approved; carrier handoff = approved →
                delivered to carrier; transit = carrier → delivered to customer.{' '}
                <code>delay_days</code> is delivery minus estimated delivery, so
                negative means early and <code>late</code> is any positive value.
              </>,
              <>
                <strong className="font-semibold text-card-foreground">
                  What this cannot tell you.
                </strong>{' '}
                The case table is pre-filtered to completed deliveries, so it says
                nothing about cancelled or undelivered orders. Late orders are{' '}
                {kpis.lateRatePct.toFixed(1)}% of cases — a heavily imbalanced
                comparison, so rates and counts are reported together throughout.
              </>,
              <>
                <strong className="font-semibold text-card-foreground">
                  Reproducibility gap.
                </strong>{' '}
                The four files in <code>data/</code> are outputs of a verification
                pipeline that runs outside this project, and the raw Olist tables
                are not included — so the exclusions cannot be re-derived here. The
                counts above are carried over from that pipeline&apos;s own
                documentation rather than recomputed, and the write-up describing
                the verification pass is not published alongside the data.
              </>,
            ].map((point, i) => (
              <li key={i} className="flex gap-2 text-pretty">
                <span
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground"
                  aria-hidden="true"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <section
            aria-label="Source and license"
            className="space-y-2 border-t border-hairline pt-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Source &amp; license
            </h2>
            <p className="text-pretty">
              Built on the{' '}
              <a
                href={KAGGLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-data underline underline-offset-2 hover:opacity-80"
              >
                Brazilian E-Commerce Public Dataset by Olist
              </a>{' '}
              (Kaggle), ~100k orders placed 2016–2018. The data is real commercial
              data, anonymised at source.
            </p>
            <p className="text-pretty">
              Licensed{' '}
              <a
                href={LICENSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-data underline underline-offset-2 hover:opacity-80"
              >
                CC BY-NC-SA 4.0
              </a>{' '}
              — verified on the Kaggle dataset page. Note the terms:
              attribution required, <strong>non-commercial use only</strong>, and
              derivatives must carry the same licence.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground/70 text-pretty">
              An independent analysis. Not affiliated with or endorsed by Olist.
            </p>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4 text-xs">
            <p className="text-muted-foreground">Built by Muna Matar</p>
            <div className="flex items-center gap-4">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-data underline underline-offset-2 hover:opacity-80"
              >
                <Github className="h-3.5 w-3.5" aria-hidden="true" />
                GitHub
              </a>
              {/* TODO: add LinkedIn once the profile URL is confirmed —
                  <a href="https://www.linkedin.com/in/…">LinkedIn</a> */}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
