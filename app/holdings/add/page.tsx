"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddHoldingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    ticker: "",
    quantity: "",
    cost_basis: "",
    purchase_date: "",
    sector: "",
    dividend_yield: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker: form.ticker,
        quantity: Number(form.quantity),
        cost_basis: Number(form.cost_basis),
        purchase_date: form.purchase_date || null,
        sector: form.sector || null,
        dividend_yield: form.dividend_yield ? Number(form.dividend_yield) : null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not add that holding.");
      return;
    }

    router.push("/holdings");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Add Holding</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Ticker" required>
          <input
            required
            value={form.ticker}
            onChange={(e) => update("ticker", e.target.value.toUpperCase())}
            placeholder="AAPL"
            className="input"
          />
        </Field>

        <Field label="Quantity" required>
          <input
            required
            type="number"
            min="0"
            step="any"
            value={form.quantity}
            onChange={(e) => update("quantity", e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Average cost per share ($)" required>
          <input
            required
            type="number"
            min="0"
            step="any"
            value={form.cost_basis}
            onChange={(e) => update("cost_basis", e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Purchase date">
          <input
            type="date"
            value={form.purchase_date}
            onChange={(e) => update("purchase_date", e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Sector (leave blank to auto-detect)">
          <input
            value={form.sector}
            onChange={(e) => update("sector", e.target.value)}
            placeholder="Technology"
            className="input"
          />
        </Field>

        <Field label="Dividend yield % (leave blank to auto-detect)">
          <input
            type="number"
            min="0"
            step="any"
            value={form.dividend_yield}
            onChange={(e) => update("dividend_yield", e.target.value)}
            placeholder="2.5"
            className="input"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add Holding"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
