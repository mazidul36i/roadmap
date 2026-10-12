/** Entity ids are random UUIDs (see CLAUDE.md conventions). */
export function uid(): string {
  return crypto.randomUUID();
}
