'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BUCKET_LABELS,
  DELAY_BUCKETS,
  type Case,
  type DelayBucket,
} from '@/lib/schema'

type Response = {
  rows: Case[]
  page: number
  pageCount: number
  total: number
  pageSize: number
}

export function RawCaseTable({
  states,
  totalCases,
}: {
  states: string[]
  totalCases: number
}) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [state, setState] = useState('')
  const [bucket, setBucket] = useState<DelayBucket | ''>('')
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Any filter change invalidates the current page number.
  useEffect(() => {
    setPage(1)
  }, [state, bucket])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ page: String(page) })
    if (state) params.set('state', state)
    if (bucket) params.set('bucket', bucket)

    fetch(`/api/cases?${params}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`)
        return r.json()
      })
      .then((d: Response) => setData(d))
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(e instanceof Error ? e.message : 'Could not load cases')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [open, page, state, bucket])

  const selectClass =
    'rounded-md border border-hairline bg-card px-2 py-1.5 text-xs text-card-foreground'

  return (
    <section className="rounded-lg border border-hairline bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span>
          <span className="block text-lg font-semibold tracking-tight text-card-foreground">
            Raw case table
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            All {totalCases.toLocaleString('en-US')} clean cases, 50 per page.
            Filter by state or delay bucket.
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="border-t border-hairline">
          <div className="flex flex-wrap items-center gap-3 px-5 py-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              State
              <select
                className={selectClass}
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                <option value="">All</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Delay
              <select
                className={selectClass}
                value={bucket}
                onChange={(e) => setBucket(e.target.value as DelayBucket | '')}
              >
                <option value="">All</option>
                {DELAY_BUCKETS.map((b) => (
                  <option key={b} value={b}>
                    {BUCKET_LABELS[b]}
                  </option>
                ))}
              </select>
            </label>
            {data ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                {data.total.toLocaleString('en-US')} matching cases
              </span>
            ) : null}
          </div>

          <div className="max-h-[520px] overflow-auto border-t border-hairline">
            {error ? (
              <p className="px-5 py-8 text-center text-sm text-bad">{error}</p>
            ) : (
              <table className="w-full border-collapse text-right text-xs tabular-nums">
                <thead className="sticky top-0 z-10 bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-card-foreground">
                      Order
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      State
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Purchased
                    </th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      Approval h
                    </th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      Carrier h
                    </th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      Transit d
                    </th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      Total d
                    </th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      Delay d
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Bucket
                    </th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      Review
                    </th>
                  </tr>
                </thead>
                <tbody className={loading ? 'opacity-50' : ''}>
                  {data?.rows.map((c) => (
                    <tr key={c.orderId} className="border-t border-hairline">
                      <td className="whitespace-nowrap px-3 py-2 text-left">
                        <code className="font-mono text-card-foreground">
                          {c.orderId.slice(0, 8)}…
                        </code>
                      </td>
                      <td className="px-3 py-2 text-left text-card-foreground">
                        {c.state}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-left text-muted-foreground">
                        {c.purchase.slice(0, 10)}
                      </td>
                      <td className="px-3 py-2 text-card-foreground">
                        {c.approvalH.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-card-foreground">
                        {c.carrierH.toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-card-foreground">
                        {c.transitDays.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-card-foreground">
                        {c.totalDays.toFixed(2)}
                      </td>
                      <td
                        className={`px-3 py-2 font-medium ${
                          c.late ? 'text-bad' : 'text-muted-foreground'
                        }`}
                      >
                        {c.delayDays > 0 ? '+' : ''}
                        {c.delayDays.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-left text-muted-foreground">
                        {BUCKET_LABELS[c.bucket]}
                      </td>
                      <td className="px-3 py-2 text-card-foreground">
                        {c.reviewScore === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          c.reviewScore.toFixed(0)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!data && !error ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Loading cases…
              </p>
            ) : null}
          </div>

          {data ? (
            <div className="flex items-center justify-between gap-3 border-t border-hairline px-5 py-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-hairline px-2.5 py-1.5 text-xs font-medium text-card-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Previous
              </button>
              <span className="text-xs tabular-nums text-muted-foreground">
                Page {data.page.toLocaleString('en-US')} of{' '}
                {data.pageCount.toLocaleString('en-US')}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.pageCount, p + 1))}
                disabled={data.page >= data.pageCount}
                className="inline-flex items-center gap-1 rounded-md border border-hairline px-2.5 py-1.5 text-xs font-medium text-card-foreground disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
