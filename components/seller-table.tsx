import { TriangleAlert } from 'lucide-react'
import { SELLER_OUTLIER_H, type Seller } from '@/lib/schema'

export function SellerTable({ sellers }: { sellers: Seller[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm tabular-nums">
        <caption className="sr-only">
          Top 15 sellers by average approval-to-carrier handoff time, minimum 20
          orders.
        </caption>
        <thead>
          <tr className="border-b border-hairline text-xs">
            <th scope="col" className="py-2 pr-3 text-left font-semibold text-muted-foreground">
              #
            </th>
            <th scope="col" className="py-2 pr-3 text-left font-semibold text-muted-foreground">
              Seller ID
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold text-muted-foreground">
              Orders
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold text-muted-foreground">
              Avg handoff
            </th>
            <th scope="col" className="py-2 text-right font-semibold text-muted-foreground">
              In days
            </th>
          </tr>
        </thead>
        <tbody>
          {sellers.map((s) => (
            <tr key={s.sellerId} className="border-b border-hairline last:border-0">
              <td className="py-2.5 pr-3 text-muted-foreground">{s.rank}</td>
              <td className="py-2.5 pr-3">
                <span className="flex items-center gap-2">
                  <code className="font-mono text-xs text-card-foreground">
                    {s.sellerId.slice(0, 10)}…
                  </code>
                  {s.isOutlier ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-bad/30 bg-bad/10 px-1.5 py-0.5 text-[10px] font-semibold text-bad"
                      title={`Above the ${SELLER_OUTLIER_H} h outlier threshold`}
                    >
                      <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                      outlier
                    </span>
                  ) : null}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-right text-muted-foreground">
                {s.orders.toLocaleString('en-US')}
              </td>
              <td
                className={`py-2.5 pr-3 text-right font-semibold ${
                  s.isOutlier ? 'text-bad' : 'text-card-foreground'
                }`}
              >
                {s.avgCarrierH.toFixed(1)} h
              </td>
              <td className="py-2.5 text-right text-muted-foreground">
                {s.avgCarrierDays.toFixed(1)} d
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
