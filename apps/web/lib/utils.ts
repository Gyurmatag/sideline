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
