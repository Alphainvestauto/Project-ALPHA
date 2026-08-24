import type { EnrichedHolding } from "@/lib/portfolio";
import { formatCurrency, formatPct } from "@/lib/format";

export default function HoldingsTable({ holdings }: { holdings: EnrichedHolding[] }) {
  if (holdings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No holdings yet. Add one manually or import a CSV from the Holdings page.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Ticker</th>
            <th className="px-4 py-3">Sector</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Avg Cost</th>
            <th className="px-4 py-3 text-right">Price</th>
            <th className="px-4 py-3 text-right">Market Value</th>
            <th className="px-4 py-3 text-right">Today</th>
            <th className="px-4 py-3 text-right">Gain/Loss</th>
            <th className="px-4 py-3 text-right">Div. Yield</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {holdings.map((h) => (
            <tr key={h.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{h.ticker}</div>
                {h.name && <div className="text-xs text-slate-400">{h.name}</div>}
              </td>
              <td className="px-4 py-3 text-slate-500">{h.sector || "Unknown"}</td>
              <td className="px-4 py-3 text-right">{h.quantity}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(h.cost_basis)}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(h.currentPrice)}</td>
              <td className="px-4 py-3 text-right font-medium">
                {formatCurrency(h.marketValue)}
              </td>
              <td
                className={`px-4 py-3 text-right ${
                  h.todayChange >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatPct(h.todayChangePct, { signed: true })}
              </td>
              <td
                className={`px-4 py-3 text-right ${
                  h.gainLoss >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatCurrency(h.gainLoss, { signed: true })}
              </td>
              <td className="px-4 py-3 text-right">
                {h.dividend_yield ? formatPct(h.dividend_yield) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
