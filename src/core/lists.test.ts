import { describe, expect, it } from 'vitest';
import {
  addListItem,
  mergeNewDefaults,
  removeListItem,
  resetList,
  MAX_ITEM_LENGTH,
} from './lists';
import { DEFAULT_LISTS } from './defaultLists';

describe('addListItem', () => {
  it('trims whitespace before adding', () => {
    const { list, result } = addListItem(['Coastal'], '  Grunge  ');
    expect(result).toEqual({ ok: true });
    expect(list).toEqual(['Coastal', 'Grunge']);
  });

  it('rejects a value longer than the max length', () => {
    const tooLong = 'x'.repeat(MAX_ITEM_LENGTH + 1);
    const { list, result } = addListItem(['Coastal'], tooLong);
    expect(result.ok).toBe(false);
    expect(list).toEqual(['Coastal']);
  });

  it('accepts a value exactly at the max length', () => {
    const exact = 'x'.repeat(MAX_ITEM_LENGTH);
    const { result } = addListItem([], exact);
    expect(result.ok).toBe(true);
  });

  it('rejects case-insensitive duplicates', () => {
    const { list, result } = addListItem(['Coastal'], 'coastal');
    expect(result.ok).toBe(false);
    expect(list).toEqual(['Coastal']);
  });

  it('rejects an empty or whitespace-only value', () => {
    const { result } = addListItem(['Coastal'], '   ');
    expect(result.ok).toBe(false);
  });
});

describe('removeListItem', () => {
  it('removes the matching item', () => {
    expect(removeListItem(['Coastal', 'Grunge'], 'Coastal')).toEqual(['Grunge']);
  });

  it('is a no-op when the item is not present', () => {
    expect(removeListItem(['Coastal'], 'Grunge')).toEqual(['Coastal']);
  });
});

describe('mergeNewDefaults', () => {
  it('appends defaults that are not yet known, keeping the existing order', () => {
    const { list, knownDefaults } = mergeNewDefaults(['B', 'Mine'], ['A', 'B'], ['A', 'B', 'C']);
    expect(list).toEqual(['B', 'Mine', 'C']);
    expect(knownDefaults).toEqual(['A', 'B', 'C']);
  });

  it('does not bring back a known default the user removed', () => {
    const { list } = mergeNewDefaults(['B'], ['A', 'B'], ['A', 'B']);
    expect(list).toEqual(['B']);
  });

  it('skips a new default the user already added in other casing', () => {
    const { list } = mergeNewDefaults(['nautical'], [], ['Nautical']);
    expect(list).toEqual(['nautical']);
  });
});

describe('resetList', () => {
  it('returns a fresh copy of the default list for that slot', () => {
    const result = resetList('style');
    expect(result).toEqual(DEFAULT_LISTS.style);
    expect(result).not.toBe(DEFAULT_LISTS.style);
  });
});
