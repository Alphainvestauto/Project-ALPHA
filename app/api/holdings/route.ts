import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichTicker } from "@/lib/finnhub";

interface NewHoldingInput {
  ticker: string;
  quantity: number;
  cost_basis: number;
  purchase_date?: string | null;
  sector?: string | null;
  dividend_yield?: number | null;
}

function validate(input: Partial<NewHoldingInput>): string | null {
  if (!input.ticker || typeof input.ticker !== "string") return "Ticker is required.";
  if (typeof input.quantity !== "number" || input.quantity <= 0)
    return `Quantity for ${input.ticker} must be a positive number.`;
  if (typeof input.cost_basis !== "number" || input.cost_basis < 0)
    return `Cost basis for ${input.ticker} must be zero or more.`;
  return null;
}

async function buildRow(input: NewHoldingInput) {
  const ticker = input.ticker.trim().toUpperCase();
  let sector = input.sector ?? null;
  let dividendYield = input.dividend_yield ?? null;
  let name: string | null = null;

  // Best-effort auto-enrichment; manual values (if provided) always win.
  if (!sector || dividendYield === null || dividendYield === undefined) {
    const enrichment = await enrichTicker(ticker);
    name = enrichment.profile.name;
    if (!sector) sector = enrichment.profile.sector;
    if (dividendYield === null || dividendYield === undefined) {
      dividendYield = enrichment.dividendYield;
    }
  }

  return {
    ticker,
    name,
    sector,
    quantity: input.quantity,
    cost_basis: input.cost_basis,
    purchase_date: input.purchase_date || null,
    dividend_yield: dividendYield,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("holdings")
    .select("*")
    .order("ticker", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ holdings: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const rows: NewHoldingInput[] = Array.isArray(body) ? body : [body];

  for (const row of rows) {
    const error = validate(row);
    if (error) return NextResponse.json({ error }, { status: 400 });
  }

  const built = await Promise.all(rows.map(buildRow));

  const { data, error } = await supabase.from("holdings").insert(built).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ holdings: data }, { status: 201 });
}
