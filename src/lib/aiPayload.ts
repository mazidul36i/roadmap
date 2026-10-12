/**
 * Removes `undefined` values (deeply) from a callable payload.
 *
 * The Firebase callable SDK serialises `undefined` as `null`, and the server's
 * `.optional()` schemas accept a missing field but reject `null`, so an unset
 * optional field (tutor context, hint notes, learner profile…) would fail
 * validation. Dropping the keys sends them as truly absent.
 */
export function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.filter(v => v !== undefined).map(withoutUndefined) as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, withoutUndefined(v)]),
    ) as T;
  }
  return value;
}
