"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Holding } from "@/lib/portfolio";

export default function HoldingsListClient({ holdings }: { holdings: Holding[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string, ticker: string) {
    if (!confirm(`Remove ${ticker} from your holdings?`)) return;
    setDeletingId(id);
    setError(null);

    const res = await fetch(`/api/holdings/${id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!res.ok) {
      setError("Could not delete that holding. Try again.");
      return;
    }
    router.refresh();
  }

  if (holdings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No holdings yet. Add one manually or import a CSV.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {error && <p className="p-3 text-sm text-red-600">{error}</p>}
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Ticker</th>
            <th className="px-4 py-3">Sector</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Avg Cost</th>
            <th className="px-4 py-3">Purchased</th>
            <th className="px-4 py-3 text-right">Div. Yield</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {holdings.map((h) => (
            <tr key={h.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{h.ticker}</td>
              <td className="px-4 py-3 text-slate-500">{h.sector || "Unknown"}</td>
              <td className="px-4 py-3 text-right">{h.quantity}</td>
              <td className="px-4 py-3 text-right">${h.cost_basis.toFixed(2)}</td>
              <td className="px-4 py-3 text-slate-500">{h.purchase_date || "—"}</td>
              <td className="px-4 py-3 text-right">
                {h.dividend_yield ? `${h.dividend_yield.toFixed(2)}%` : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(h.id, h.ticker)}
                  disabled={deletingId === h.id}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {deletingId === h.id ? "Removing..." : "Remove"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
