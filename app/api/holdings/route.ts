import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichTicker } from "@/lib/finnhub";
import { validateHoldingFields } from "@/lib/holdings-validation";

interface NewHoldingInput {
  ticker: string;
  quantity: number;
  cost_basis: number;
  purchase_date?: string | null;
  sector?: string | null;
  dividend_yield?: number | null;
}

// Cap how many rows are enriched from Finnhub at once (2 calls/row) so a
// large CSV import doesn't burst past the free-tier rate limit.
const ENRICH_BATCH_SIZE = 5;

async function buildRows(rows: NewHoldingInput[]) {
  const built: Awaited<ReturnType<typeof buildRow>>[] = [];
  for (let i = 0; i < rows.length; i += ENRICH_BATCH_SIZE) {
    const batch = rows.slice(i, i + ENRICH_BATCH_SIZE);
    built.push(...(await Promise.all(batch.map(buildRow))));
  }
  return built;
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
    const error = validateHoldingFields(row, { requireCore: true });
    if (error) return NextResponse.json({ error: `${row.ticker || "Row"}: ${error}` }, { status: 400 });
  }

  const built = await buildRows(rows);

  const { data, error } = await supabase.from("holdings").insert(built).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ holdings: data }, { status: 201 });
}
