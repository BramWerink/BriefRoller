import { describe, expect, it } from 'vitest';
import { pickExcluding, rollUnlockedSlots } from './roll';
import type { SlotsState, BriefListsState } from './types';

describe('pickExcluding', () => {
  it('never returns the excluded value when the list has more than one item', () => {
    const list = ['a', 'b'];
    for (let i = 0; i < 50; i++) {
      expect(pickExcluding(list, 'a', () => i / 50)).not.toBe('a');
    }
  });

  it('returns the only item when the list has exactly one item, even if excluded', () => {
    expect(pickExcluding(['only'], 'only')).toBe('only');
  });

  it('returns null for an empty list', () => {
    expect(pickExcluding([], null)).toBeNull();
  });

  it('can return any item when exclude is null', () => {
    const list = ['a', 'b', 'c'];
    expect(pickExcluding(list, null, () => 0)).toBe('a');
    expect(pickExcluding(list, null, () => 0.99)).toBe('c');
  });
});

describe('rollUnlockedSlots', () => {
  const lists: BriefListsState = {
    style: ['Coastal', 'Brutalist'],
    deliverable: ['Sticker', 'Poster'],
    client: ['Fish shop', 'Bakery'],
  };

  it('leaves locked slots untouched', () => {
    const slots: SlotsState = {
      style: { value: 'Coastal', locked: true },
      deliverable: { value: 'Sticker', locked: false },
      client: { value: 'Fish shop', locked: true },
    };
    const result = rollUnlockedSlots(lists, slots, () => 0.9);
    expect(result.style).toBe('Coastal');
    expect(result.client).toBe('Fish shop');
  });

  it('rolls unlocked slots to a value different from the current one', () => {
    const slots: SlotsState = {
      style: { value: 'Coastal', locked: false },
      deliverable: { value: 'Sticker', locked: false },
      client: { value: 'Fish shop', locked: false },
    };
    const result = rollUnlockedSlots(lists, slots, () => 0);
    expect(result.style).not.toBe('Coastal');
    expect(result.deliverable).not.toBe('Sticker');
    expect(result.client).not.toBe('Fish shop');
  });
});
