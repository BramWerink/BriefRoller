import { beforeEach, describe, expect, it } from 'vitest';
import { loadState, saveState, STORAGE_KEY } from './persistence';
import { createDefaultState, DEFAULT_THEME_ID } from './defaultState';
import { DEFAULT_LISTS } from './defaultLists';

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when nothing is stored', () => {
    expect(loadState()).toEqual(createDefaultState());
  });

  it('returns defaults when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(loadState()).toEqual(createDefaultState());
  });

  it('round-trips a valid saved state', () => {
    const state = createDefaultState();
    state.pinned = true;
    state.lists.style.push('Custom style');
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('adds defaults released after the save, but not ones the user deleted', () => {
    const state = createDefaultState();
    // This browser saw every default except "Nautical"...
    state.knownDefaults.style = state.knownDefaults.style.filter((s) => s !== 'Nautical');
    // ...then deleted "Kawaii", added its own style, and never had "Nautical".
    state.lists.style = state.lists.style.filter((s) => s !== 'Kawaii' && s !== 'Nautical');
    state.lists.style.push('Solarpunk');
    saveState(state);

    const loaded = loadState();
    expect(loaded.lists.style).not.toContain('Kawaii');
    expect(loaded.lists.style.slice(-2)).toEqual(['Solarpunk', 'Nautical']);
    expect(loaded.knownDefaults.style).toEqual(DEFAULT_LISTS.style);

    // Loading again is stable: nothing else is appended.
    saveState(loaded);
    expect(loadState().lists.style).toEqual(loaded.lists.style);
  });

  it('falls back field-by-field when part of the stored data is malformed', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        lists: { style: ['Custom'], deliverable: 'not-an-array', client: ['Fish shop'] },
        slots: 'garbage',
        history: [{ id: 1, values: {}, rolledAt: 'nope' }],
        themeId: 'plain',
        pinned: 'yes',
      }),
    );
    const result = loadState();
    const defaults = createDefaultState();

    // Old-format saves have no knownDefaults, so missing defaults are appended.
    expect(result.lists.style).toEqual(['Custom', ...defaults.lists.style]);
    expect(result.lists.deliverable).toEqual(defaults.lists.deliverable);
    expect(result.lists.client[0]).toBe('Fish shop');
    expect(result.lists.client).toHaveLength(defaults.lists.client.length);
    expect(result.slots).toEqual(defaults.slots);
    expect(result.history).toEqual([]);
    expect(result.themeId).toBe(defaults.themeId);
    expect(result.pinned).toBe(defaults.pinned);
    expect(result.companyEnabled).toBe(defaults.companyEnabled);
  });

  it('moves saves on the old default theme to the current default, and keeps others', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ themeId: 'plain' }));
    expect(loadState().themeId).toBe(DEFAULT_THEME_ID);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ themeId: 'some-future-theme' }));
    expect(loadState().themeId).toBe('some-future-theme');
  });

  it('defaults companyEnabled to on, and respects a saved value', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    expect(loadState().companyEnabled).toBe(true);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ companyEnabled: false }));
    expect(loadState().companyEnabled).toBe(false);
  });

  it('keeps a company-enabled history entry, and drops one with a non-string company', () => {
    const state = createDefaultState();
    state.history = [
      {
        id: 'a',
        values: { style: 'Coastal', deliverable: 'Sticker', client: 'Bakery' },
        rolledAt: 1,
      },
      {
        id: 'b',
        values: {
          style: 'Coastal',
          deliverable: 'Sticker',
          client: 'Bakery',
          company: 'Northlane',
        },
        rolledAt: 2,
      },
    ];
    saveState(state);
    expect(loadState().history).toHaveLength(2);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        history: [
          {
            id: 'c',
            values: { style: 'Coastal', deliverable: 'Sticker', client: 'Bakery', company: 5 },
            rolledAt: 3,
          },
        ],
      }),
    );
    expect(loadState().history).toEqual([]);
  });
});
