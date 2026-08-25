import { createClient } from "@/lib/supabase/server";
import { getQuotes } from "@/lib/finnhub";
import {
  enrichHoldings,
  summarizePortfolio,
  sectorAllocation,
  concentrationFlags,
  type Holding,
} from "@/lib/portfolio";
import { formatCurrency, formatPct } from "@/lib/format";

export const revalidate = 0;

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: holdingsData } = await supabase
    .from("holdings")
    .select("*")
    .order("ticker", { ascending: true });

  const holdings = (holdingsData ?? []) as Holding[];
  const quotes = await getQuotes(holdings.map((h) => h.ticker));
  const enriched = enrichHoldings(holdings, quotes);
  const summary = summarizePortfolio(enriched);
  const sectors = sectorAllocation(enriched);
  const flags = concentrationFlags(enriched, sectors);

  const dividendHoldings = [...enriched]
    .filter((h) => h.dividend_yield)
    .sort((a, b) => (b.dividend_yield ?? 0) - (a.dividend_yield ?? 0));

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Insights</h1>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Not financial advice.</p>
        <p className="mt-1">
          These insights are simple, automated observations about your existing holdings.
          They are not a recommendation to buy, sell, or hold any investment. Concentration
          thresholds are generic rules of thumb, not personalized guidance — consider talking
          to a licensed financial advisor before making investment decisions.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700">Concentration Flags</h2>
        {flags.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No concentration flags right now. No single stock is 20%+ of the portfolio and no
            sector is 35%+ of the portfolio.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {flags.map((f) => (
              <li
                key={`${f.type}-${f.label}`}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
              >
                <span>
                  {f.type === "stock" ? (
                    <>
                      <strong>{f.label}</strong> makes up a large share of your portfolio
                    </>
                  ) : (
                    <>
                      The <strong>{f.label}</strong> sector makes up a large share of your
                      portfolio
                    </>
                  )}
                </span>
                <span className="font-medium text-amber-800">{formatPct(f.pct)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">Dividend Yield</h2>
          <span className="text-sm text-slate-500">
            Portfolio average:{" "}
            <strong className="text-slate-900">
              {formatPct(summary.weightedDividendYield)}
            </strong>
          </span>
        </div>

        {dividendHoldings.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No dividend yield data available yet for your holdings.
          </p>
        ) : (
          <table className="mt-3 min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2">Ticker</th>
                <th className="py-2 text-right">Yield</th>
                <th className="py-2 text-right">Est. Annual Income</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dividendHoldings.map((h) => (
                <tr key={h.id}>
                  <td className="py-2 font-medium text-slate-900">{h.ticker}</td>
                  <td className="py-2 text-right">{formatPct(h.dividend_yield ?? 0)}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(h.annualDividendIncome)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
