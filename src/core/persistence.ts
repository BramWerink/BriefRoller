import type { BriefListsState, HistoryEntry, PersistedStateV1, SlotsState } from './types';
import { SLOT_IDS } from './types';
import { createDefaultState } from './defaultState';
import { cloneDefaultLists, DEFAULT_LISTS } from './defaultLists';
import { mergeNewDefaults } from './lists';

export const STORAGE_KEY = 'brief-roller:state:v1';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function sanitizeLists(value: unknown): BriefListsState {
  const fallback = cloneDefaultLists();
  if (typeof value !== 'object' || value === null) return fallback;
  const candidate = value as Record<string, unknown>;
  const result = { ...fallback };
  SLOT_IDS.forEach((id) => {
    if (isStringArray(candidate[id])) {
      result[id] = candidate[id] as string[];
    }
  });
  return result;
}

/**
 * Saves from before knownDefaults existed don't say which defaults were seen,
 * so treat the saved list itself as seen: anything missing from it is added.
 */
function sanitizeKnownDefaults(value: unknown, savedLists: BriefListsState): BriefListsState {
  const result = { ...savedLists };
  if (typeof value !== 'object' || value === null) return result;
  const candidate = value as Record<string, unknown>;
  SLOT_IDS.forEach((id) => {
    if (isStringArray(candidate[id])) {
      result[id] = candidate[id] as string[];
    }
  });
  return result;
}

function sanitizeSlots(value: unknown): SlotsState {
  const fallback = createDefaultState().slots;
  if (typeof value !== 'object' || value === null) return fallback;
  const candidate = value as Record<string, unknown>;
  const result = { ...fallback };
  SLOT_IDS.forEach((id) => {
    const slot = candidate[id];
    if (
      typeof slot === 'object' &&
      slot !== null &&
      (typeof (slot as { value: unknown }).value === 'string' ||
        (slot as { value: unknown }).value === null) &&
      typeof (slot as { locked: unknown }).locked === 'boolean'
    ) {
      result[id] = slot as { value: string | null; locked: boolean };
    }
  });
  return result;
}

function isValidHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  if (typeof entry.id !== 'string' || typeof entry.rolledAt !== 'number') return false;
  const values = entry.values;
  if (typeof values !== 'object' || values === null) return false;
  return SLOT_IDS.every((id) => typeof (values as Record<string, unknown>)[id] === 'string');
}

function sanitizeHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isValidHistoryEntry);
}

export function loadState(): PersistedStateV1 {
  const fallback = createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const savedLists = sanitizeLists(parsed.lists);
    const savedKnown = sanitizeKnownDefaults(parsed.knownDefaults, savedLists);
    const lists = {} as BriefListsState;
    const knownDefaults = {} as BriefListsState;
    SLOT_IDS.forEach((id) => {
      const merged = mergeNewDefaults(savedLists[id], savedKnown[id], DEFAULT_LISTS[id]);
      lists[id] = merged.list;
      knownDefaults[id] = merged.knownDefaults;
    });
    return {
      version: 1,
      lists,
      knownDefaults,
      slots: sanitizeSlots(parsed.slots),
      history: sanitizeHistory(parsed.history),
      themeId: typeof parsed.themeId === 'string' ? parsed.themeId : fallback.themeId,
      pinned: typeof parsed.pinned === 'boolean' ? parsed.pinned : fallback.pinned,
    };
  } catch {
    return fallback;
  }
}

export function saveState(state: PersistedStateV1): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable or full — persistence is best-effort.
  }
}
