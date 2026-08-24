import type { Quote } from "@/lib/finnhub";

export interface Holding {
  id: string;
  ticker: string;
  name: string | null;
  sector: string | null;
  quantity: number;
  cost_basis: number;
  purchase_date: string | null;
  dividend_yield: number | null;
}

export interface EnrichedHolding extends Holding {
  currentPrice: number;
  previousClose: number;
  marketValue: number;
  costValue: number;
  gainLoss: number;
  gainLossPct: number;
  todayChange: number;
  todayChangePct: number;
  annualDividendIncome: number;
}

export function enrichHoldings(
  holdings: Holding[],
  quotes: Record<string, Quote>
): EnrichedHolding[] {
  return holdings.map((h) => {
    const quote = quotes[h.ticker.toUpperCase()] ?? {
      current: 0,
      previousClose: 0,
    };
    const currentPrice = quote.current || h.cost_basis;
    const previousClose = quote.previousClose || currentPrice;

    const marketValue = currentPrice * h.quantity;
    const costValue = h.cost_basis * h.quantity;
    const gainLoss = marketValue - costValue;
    const gainLossPct = costValue > 0 ? (gainLoss / costValue) * 100 : 0;

    const todayChange = (currentPrice - previousClose) * h.quantity;
    const priorValue = previousClose * h.quantity;
    const todayChangePct = priorValue > 0 ? (todayChange / priorValue) * 100 : 0;

    const annualDividendIncome = h.dividend_yield
      ? (h.dividend_yield / 100) * marketValue
      : 0;

    return {
      ...h,
      currentPrice,
      previousClose,
      marketValue,
      costValue,
      gainLoss,
      gainLossPct,
      todayChange,
      todayChangePct,
      annualDividendIncome,
    };
  });
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  todayChange: number;
  todayChangePct: number;
  weightedDividendYield: number;
}

export function summarizePortfolio(holdings: EnrichedHolding[]): PortfolioSummary {
  const totalValue = sum(holdings.map((h) => h.marketValue));
  const totalCost = sum(holdings.map((h) => h.costValue));
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const todayChange = sum(holdings.map((h) => h.todayChange));
  const priorTotal = totalValue - todayChange;
  const todayChangePct = priorTotal > 0 ? (todayChange / priorTotal) * 100 : 0;

  const weightedDividendYield =
    totalValue > 0
      ? sum(holdings.map((h) => h.annualDividendIncome)) / totalValue * 100
      : 0;

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPct,
    todayChange,
    todayChangePct,
    weightedDividendYield,
  };
}

export interface SectorSlice {
  sector: string;
  value: number;
  pct: number;
}

export function sectorAllocation(holdings: EnrichedHolding[]): SectorSlice[] {
  const totalValue = sum(holdings.map((h) => h.marketValue));
  const bySector = new Map<string, number>();
  for (const h of holdings) {
    const sector = h.sector?.trim() || "Unknown";
    bySector.set(sector, (bySector.get(sector) ?? 0) + h.marketValue);
  }
  return Array.from(bySector.entries())
    .map(([sector, value]) => ({
      sector,
      value,
      pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export interface ConcentrationFlag {
  type: "stock" | "sector";
  label: string;
  pct: number;
}

const STOCK_CONCENTRATION_THRESHOLD = 20; // % of portfolio in a single holding
const SECTOR_CONCENTRATION_THRESHOLD = 35; // % of portfolio in a single sector

export function concentrationFlags(
  holdings: EnrichedHolding[],
  sectors: SectorSlice[]
): ConcentrationFlag[] {
  const totalValue = sum(holdings.map((h) => h.marketValue));
  const flags: ConcentrationFlag[] = [];

  for (const h of holdings) {
    const pct = totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0;
    if (pct >= STOCK_CONCENTRATION_THRESHOLD) {
      flags.push({ type: "stock", label: h.ticker, pct });
    }
  }

  for (const s of sectors) {
    if (s.pct >= SECTOR_CONCENTRATION_THRESHOLD) {
      flags.push({ type: "sector", label: s.sector, pct: s.pct });
    }
  }

  return flags.sort((a, b) => b.pct - a.pct);
}

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}
