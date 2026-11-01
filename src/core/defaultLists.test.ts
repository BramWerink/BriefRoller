import { describe, expect, it } from 'vitest';
import { DEFAULT_LISTS } from './defaultLists';
import { MAX_ITEM_LENGTH } from './lists';
import { SLOT_IDS } from './types';

describe('DEFAULT_LISTS', () => {
  it.each(SLOT_IDS)('%s has no case-insensitive duplicates', (id) => {
    const lowered = DEFAULT_LISTS[id].map((item) => item.toLowerCase());
    expect(new Set(lowered).size).toBe(lowered.length);
  });

  it.each(SLOT_IDS)('%s items fit the max item length', (id) => {
    DEFAULT_LISTS[id].forEach((item) => {
      expect(item.trim()).toBe(item);
      expect(item.length).toBeGreaterThan(0);
      expect(item.length).toBeLessThanOrEqual(MAX_ITEM_LENGTH);
    });
  });
});
