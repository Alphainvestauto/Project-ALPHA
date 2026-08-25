import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateHoldingFields } from "@/lib/holdings-validation";

interface UpdateHoldingInput {
  ticker?: string;
  quantity?: number;
  cost_basis?: number;
  purchase_date?: string | null;
  sector?: string | null;
  dividend_yield?: number | null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body: UpdateHoldingInput = await request.json();

  const validationError = validateHoldingFields(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.ticker !== undefined) update.ticker = body.ticker.trim().toUpperCase();
  if (body.quantity !== undefined) update.quantity = body.quantity;
  if (body.cost_basis !== undefined) update.cost_basis = body.cost_basis;
  if (body.purchase_date !== undefined) update.purchase_date = body.purchase_date;
  if (body.sector !== undefined) update.sector = body.sector;
  if (body.dividend_yield !== undefined) update.dividend_yield = body.dividend_yield;

  const { data, error } = await supabase
    .from("holdings")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ holding: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("holdings").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
