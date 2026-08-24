export function formatCurrency(value: number, opts: { signed?: boolean } = {}) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (!opts.signed) return formatted;
  return value < 0 ? `-${formatted}` : `+${formatted}`;
}

export function formatPct(value: number, opts: { signed?: boolean } = {}) {
  const formatted = `${Math.abs(value).toFixed(2)}%`;
  if (!opts.signed) return formatted;
  return value < 0 ? `-${formatted}` : `+${formatted}`;
}
