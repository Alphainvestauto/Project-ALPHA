import { NextResponse } from "next/server";
import { getQuotes } from "@/lib/finnhub";

export async function POST(request: Request) {
  const { tickers } = (await request.json()) as { tickers: string[] };
  if (!Array.isArray(tickers) || tickers.length === 0) {
    return NextResponse.json({ quotes: {} });
  }
  const quotes = await getQuotes(tickers);
  return NextResponse.json({ quotes });
}
