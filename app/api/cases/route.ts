import { NextResponse } from 'next/server'
import { getCases } from '@/lib/data'

const PAGE_SIZE = 50

/**
 * Pages the fact table server-side. The full file is 16 MB — shipping it to the
 * browser to render a collapsible preview would dwarf the rest of the payload,
 * so the table pulls one page at a time and every row stays reachable.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const state = searchParams.get('state') ?? ''
  const bucket = searchParams.get('bucket') ?? ''

  let cases = getCases()
  if (state) cases = cases.filter((c) => c.state === state)
  if (bucket) cases = cases.filter((c) => c.bucket === bucket)

  const total = cases.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * PAGE_SIZE

  return NextResponse.json({
    rows: cases.slice(start, start + PAGE_SIZE),
    page: current,
    pageCount,
    total,
    pageSize: PAGE_SIZE,
  })
}
