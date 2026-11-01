import type { SlotId, SlotsState, BriefListsState } from './types';

export type RandomFn = () => number;

/**
 * Picks a random item from `list`. If the list has more than one item and
 * `exclude` is one of them, the result is guaranteed not to equal `exclude`.
 * Returns null for an empty list.
 */
export function pickExcluding(
  list: string[],
  exclude: string | null,
  random: RandomFn = Math.random,
): string | null {
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];

  const candidates = exclude === null ? list : list.filter((item) => item !== exclude);
  const pool = candidates.length > 0 ? candidates : list;
  const index = Math.floor(random() * pool.length);
  return pool[index];
}

/**
 * Computes the next value for every unlocked slot (locked slots are left
 * untouched). Each unlocked slot's new value is drawn from its list,
 * excluding its current value, per `pickExcluding`.
 */
export function rollUnlockedSlots(
  lists: BriefListsState,
  slots: SlotsState,
  random: RandomFn = Math.random,
): Record<SlotId, string | null> {
  const result = {} as Record<SlotId, string | null>;
  (Object.keys(slots) as SlotId[]).forEach((slotId) => {
    const slot = slots[slotId];
    if (slot.locked) {
      result[slotId] = slot.value;
      return;
    }
    result[slotId] = pickExcluding(lists[slotId], slot.value, random);
  });
  return result;
}
