import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Holding } from "@/lib/portfolio";
import HoldingsListClient from "@/components/HoldingsListClient";

export const revalidate = 0;

export default async function HoldingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("holdings")
    .select("*")
    .order("ticker", { ascending: true });

  const holdings = (data ?? []) as Holding[];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Holdings</h1>
        <div className="flex gap-3">
          <Link
            href="/holdings/import"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Import CSV
          </Link>
          <Link
            href="/holdings/add"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Add Holding
          </Link>
        </div>
      </div>

      <HoldingsListClient holdings={holdings} />
    </main>
  );
}
