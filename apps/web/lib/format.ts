/**
 * Convert an arbitrary string (event name, org name) into a URL-safe slug.
 * Used for event join links like /e/<slug>.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format a play-money amount with the event's currency name.
 * Balances are integers in the data model; we round defensively.
 */
export function formatPlayMoney(amount: number, currencyName = "Sideline Bucks"): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString("en-US")} ${currencyName}`;
}

/** Probability (0..1) as a whole-percent string, e.g. 0.62 -> "62%". */
export function formatProbability(p: number): string {
  return `${Math.round(p * 100)}%`;
}

/** Probability (0..1) as a one-decimal percent string, e.g. 0.6225 -> "62.2%". */
export function formatPercent1(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}
