import type { PortfolioSummary } from "@/lib/portfolio";
import { formatCurrency, formatPct } from "@/lib/format";

export default function SummaryCards({ summary }: { summary: PortfolioSummary }) {
  const cards = [
    {
      label: "Total Value",
      value: formatCurrency(summary.totalValue),
      sub: null as string | null,
      tone: "neutral" as const,
    },
    {
      label: "Today's Change",
      value: formatCurrency(summary.todayChange, { signed: true }),
      sub: formatPct(summary.todayChangePct, { signed: true }),
      tone: summary.todayChange >= 0 ? "positive" : "negative",
    },
    {
      label: "Total Gain/Loss",
      value: formatCurrency(summary.totalGainLoss, { signed: true }),
      sub: formatPct(summary.totalGainLossPct, { signed: true }),
      tone: summary.totalGainLoss >= 0 ? "positive" : "negative",
    },
    {
      label: "Avg. Dividend Yield",
      value: formatPct(summary.weightedDividendYield),
      sub: "Portfolio-weighted",
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-slate-500">{card.label}</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              card.tone === "positive"
                ? "text-emerald-600"
                : card.tone === "negative"
                ? "text-red-600"
                : "text-slate-900"
            }`}
          >
            {card.value}
          </p>
          {card.sub && <p className="mt-1 text-sm text-slate-400">{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}
