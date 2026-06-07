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

/** Compact relative time, e.g. "just now", "3m ago", "2h ago". */
export function timeAgo(from: Date, now: Date = new Date()): string {
  const secs = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Initials for an agent/user display name, e.g. "Oracle GPT" -> "OG". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
