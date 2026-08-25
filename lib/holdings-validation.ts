export interface HoldingFieldsInput {
  ticker?: string;
  quantity?: number;
  cost_basis?: number;
  dividend_yield?: number | null;
  purchase_date?: string | null;
}

export function validateHoldingFields(
  input: HoldingFieldsInput,
  opts: { requireCore?: boolean } = {}
): string | null {
  if (opts.requireCore) {
    if (!input.ticker || typeof input.ticker !== "string") return "Ticker is required.";
    if (typeof input.quantity !== "number") return "Quantity is required.";
    if (typeof input.cost_basis !== "number") return "Cost basis is required.";
  }

  if (input.ticker !== undefined && !input.ticker.trim()) return "Ticker cannot be empty.";
  if (
    input.quantity !== undefined &&
    (typeof input.quantity !== "number" || input.quantity <= 0)
  )
    return "Quantity must be a positive number.";
  if (
    input.cost_basis !== undefined &&
    (typeof input.cost_basis !== "number" || input.cost_basis < 0)
  )
    return "Cost basis must be zero or more.";
  if (
    input.dividend_yield !== undefined &&
    input.dividend_yield !== null &&
    (typeof input.dividend_yield !== "number" || input.dividend_yield < 0)
  )
    return "Dividend yield must be zero or more.";
  if (
    input.purchase_date !== undefined &&
    input.purchase_date !== null &&
    Number.isNaN(Date.parse(input.purchase_date))
  )
    return "Purchase date is not a valid date.";

  return null;
}
