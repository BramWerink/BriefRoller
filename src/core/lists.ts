import type { AddListItemResult, SlotId, BriefListsState } from './types';
import { DEFAULT_LISTS } from './defaultLists';

export const MAX_ITEM_LENGTH = 32;

export function addListItem(
  list: string[],
  rawValue: string,
): { list: string[]; result: AddListItemResult } {
  const value = rawValue.trim();

  if (value.length === 0) {
    return { list, result: { ok: false, reason: 'Enter a value first' } };
  }
  if (value.length > MAX_ITEM_LENGTH) {
    return { list, result: { ok: false, reason: `Keep it under ${MAX_ITEM_LENGTH} characters` } };
  }
  const isDuplicate = list.some((item) => item.toLowerCase() === value.toLowerCase());
  if (isDuplicate) {
    return { list, result: { ok: false, reason: 'Already on the list' } };
  }

  return { list: [...list, value], result: { ok: true } };
}

export function removeListItem(list: string[], value: string): string[] {
  return list.filter((item) => item !== value);
}

export function resetList(slot: SlotId): string[] {
  return [...DEFAULT_LISTS[slot]];
}

/**
 * Appends defaults that are new since `knownDefaults` was recorded, skipping
 * any already on the list (case-insensitive). Known defaults the user removed
 * are not brought back. Returns the merged list and the updated known set.
 */
export function mergeNewDefaults(
  list: string[],
  knownDefaults: string[],
  defaults: string[],
): { list: string[]; knownDefaults: string[] } {
  const known = new Set(knownDefaults.map((item) => item.toLowerCase()));
  const present = new Set(list.map((item) => item.toLowerCase()));
  const additions = defaults.filter((item) => {
    const key = item.toLowerCase();
    return !known.has(key) && !present.has(key);
  });
  return { list: [...list, ...additions], knownDefaults: [...defaults] };
}

export function resetAllLists(): BriefListsState {
  return {
    style: resetList('style'),
    deliverable: resetList('deliverable'),
    client: resetList('client'),
    company: resetList('company'),
  };
}
