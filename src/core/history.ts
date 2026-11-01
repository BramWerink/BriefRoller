import type { HistoryEntry, SlotId } from './types';

export const HISTORY_LIMIT = 10;

export function pushHistoryEntry(
  history: HistoryEntry[],
  values: Record<SlotId, string>,
  makeId: () => string = () => crypto.randomUUID(),
  rolledAt: number = Date.now(),
): HistoryEntry[] {
  const entry: HistoryEntry = { id: makeId(), values, rolledAt };
  return [entry, ...history].slice(0, HISTORY_LIMIT);
}
