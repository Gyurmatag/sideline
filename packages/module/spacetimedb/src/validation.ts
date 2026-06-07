/** Event-slug validation (pure, unit-tested). Maincloud-style: lowercase
 * letters/numbers separated by single hyphens, 2-40 chars. */
export function isValidSlug(s: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length >= 2 && s.length <= 40;
}
