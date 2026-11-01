import { describe, expect, it } from 'vitest';
import { pushHistoryEntry, HISTORY_LIMIT } from './history';
import type { HistoryEntry } from './types';

describe('pushHistoryEntry', () => {
  it('adds the new entry to the front (newest first)', () => {
    const existing: HistoryEntry[] = [
      { id: 'old', values: { style: 'Coastal', deliverable: 'Sticker', client: 'Fish shop' }, rolledAt: 1 },
    ];
    const result = pushHistoryEntry(
      existing,
      { style: 'Brutalist', deliverable: 'Poster', client: 'Bakery' },
      () => 'new',
      2,
    );
    expect(result[0].id).toBe('new');
    expect(result[1].id).toBe('old');
  });

  it('caps history at 10 entries, dropping the oldest', () => {
    let history: HistoryEntry[] = [];
    for (let i = 0; i < 15; i++) {
      history = pushHistoryEntry(
        history,
        { style: 'Coastal', deliverable: 'Sticker', client: 'Fish shop' },
        () => `id-${i}`,
        i,
      );
    }
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0].id).toBe('id-14');
    expect(history[HISTORY_LIMIT - 1].id).toBe('id-5');
  });
});
