"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { handleSessionExpired } from "@/lib/session-expired";

interface ParsedRow {
  ticker: string;
  quantity: number;
  cost_basis: number;
  purchase_date: string | null;
  sector: string | null;
  dividend_yield: number | null;
  _error?: string;
}

const TEMPLATE = `ticker,quantity,cost_basis,purchase_date,sector,dividend_yield
AAPL,10,150.25,2023-04-12,,
MSFT,5,300.00,2023-06-01,Technology,0.8
`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "holdings-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseRow(raw: Record<string, string>): ParsedRow {
  const ticker = (raw.ticker || "").trim().toUpperCase();
  const quantity = Number(raw.quantity);
  const costBasis = Number(raw.cost_basis);

  let errorMsg: string | undefined;
  if (!ticker) errorMsg = "Missing ticker";
  else if (!Number.isFinite(quantity) || quantity <= 0) errorMsg = "Invalid quantity";
  else if (!Number.isFinite(costBasis) || costBasis < 0) errorMsg = "Invalid cost basis";

  return {
    ticker,
    quantity,
    cost_basis: costBasis,
    purchase_date: raw.purchase_date?.trim() || null,
    sector: raw.sector?.trim() || null,
    dividend_yield: raw.dividend_yield ? Number(raw.dividend_yield) : null,
    _error: errorMsg,
  };
}

export default function ImportHoldingsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data.map(parseRow));
      },
      error: (err) => setError(err.message),
    });
  }

  const validRows = rows.filter((r) => !r._error);
  const invalidRows = rows.filter((r) => r._error);

  async function handleImport() {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        validRows.map(({ _error, ...row }) => row)
      ),
    });

    setSubmitting(false);

    if (handleSessionExpired(res, router)) return;

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Import failed. Please check your file and try again.");
      return;
    }

    router.push("/holdings");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Import Holdings from CSV</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Your CSV needs a header row with these columns: <code>ticker</code>,{" "}
          <code>quantity</code>, <code>cost_basis</code>, and optionally{" "}
          <code>purchase_date</code> (YYYY-MM-DD), <code>sector</code>, and{" "}
          <code>dividend_yield</code> (as a percent, e.g. 2.5). Sector and dividend yield
          will be auto-detected if left blank.
        </p>
        <button
          onClick={downloadTemplate}
          className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Download a template CSV
        </button>

        <div className="mt-4">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="text-sm"
          />
          {fileName && <p className="mt-1 text-xs text-slate-400">{fileName}</p>}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700">
            Preview — {validRows.length} valid row{validRows.length === 1 ? "" : "s"}
            {invalidRows.length > 0 && `, ${invalidRows.length} with errors (skipped)`}
          </h2>

          <div className="mt-3 max-h-80 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Ticker</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2 pr-4">Cost</th>
                  <th className="py-2 pr-4">Purchased</th>
                  <th className="py-2 pr-4">Sector</th>
                  <th className="py-2 pr-4">Yield %</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={i} className={r._error ? "bg-red-50" : undefined}>
                    <td className="py-2 pr-4">{r.ticker || "—"}</td>
                    <td className="py-2 pr-4">{r.quantity || "—"}</td>
                    <td className="py-2 pr-4">{r.cost_basis || "—"}</td>
                    <td className="py-2 pr-4">{r.purchase_date || "—"}</td>
                    <td className="py-2 pr-4">{r.sector || "auto"}</td>
                    <td className="py-2 pr-4">{r.dividend_yield ?? "auto"}</td>
                    <td className="py-2 text-red-600">{r._error || "OK"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleImport}
            disabled={submitting || validRows.length === 0}
            className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? "Importing..." : `Import ${validRows.length} Holding${validRows.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}
    </main>
  );
}
