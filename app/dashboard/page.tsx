import { createClient } from "@/lib/supabase/server";
import { getQuotes } from "@/lib/finnhub";
import { enrichHoldings, summarizePortfolio, sectorAllocation, type Holding } from "@/lib/portfolio";
import SummaryCards from "@/components/SummaryCards";
import HoldingsTable from "@/components/HoldingsTable";
import SectorChart from "@/components/SectorChart";

export const revalidate = 0;

export default async function DashboardPage() {
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

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

      <SummaryCards summary={summary} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HoldingsTable holdings={enriched} />
        </div>
        <SectorChart sectors={sectors} />
      </div>
    </main>
  );
}
