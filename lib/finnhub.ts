const BASE_URL = "https://finnhub.io/api/v1";

export interface Quote {
  current: number;
  previousClose: number;
}

export interface Profile {
  name: string | null;
  sector: string | null;
}

function apiKey() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY is not set");
  return key;
}

async function finnhubGet<T>(path: string, params: Record<string, string>) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("token", apiKey());

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Finnhub request failed (${res.status}): ${path}`);
  }
  return (await res.json()) as T;
}

export async function getQuote(ticker: string): Promise<Quote> {
  const data = await finnhubGet<{ c: number; pc: number }>("/quote", {
    symbol: ticker.toUpperCase(),
  });
  return { current: data.c ?? 0, previousClose: data.pc ?? 0 };
}

export async function getQuotes(
  tickers: string[]
): Promise<Record<string, Quote>> {
  const unique = Array.from(new Set(tickers.map((t) => t.toUpperCase())));
  const results = await Promise.all(
    unique.map(async (ticker) => {
      try {
        return [ticker, await getQuote(ticker)] as const;
      } catch {
        return [ticker, { current: 0, previousClose: 0 }] as const;
      }
    })
  );
  return Object.fromEntries(results);
}

export async function getProfile(ticker: string): Promise<Profile> {
  try {
    const data = await finnhubGet<{
      name?: string;
      finnhubIndustry?: string;
    }>("/stock/profile2", { symbol: ticker.toUpperCase() });
    return { name: data.name ?? null, sector: data.finnhubIndustry ?? null };
  } catch {
    return { name: null, sector: null };
  }
}

export async function getDividendYield(ticker: string): Promise<number | null> {
  try {
    const data = await finnhubGet<{
      metric?: { dividendYieldIndicatedAnnual?: number; currentDividendYieldTTM?: number };
    }>("/stock/metric", { symbol: ticker.toUpperCase(), metric: "all" });
    const yieldPct =
      data.metric?.dividendYieldIndicatedAnnual ??
      data.metric?.currentDividendYieldTTM ??
      null;
    return typeof yieldPct === "number" ? yieldPct : null;
  } catch {
    return null;
  }
}

export async function enrichTicker(ticker: string) {
  const [profile, dividendYield] = await Promise.all([
    getProfile(ticker),
    getDividendYield(ticker),
  ]);
  return { profile, dividendYield };
}
