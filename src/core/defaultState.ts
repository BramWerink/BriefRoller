import type { PersistedStateV1, SlotsState } from './types';
import { SLOT_IDS } from './types';
import { cloneDefaultLists } from './defaultLists';

export const DEFAULT_THEME_ID = 'cabin';

export function createDefaultSlots(): SlotsState {
  const slots = {} as SlotsState;
  SLOT_IDS.forEach((id) => {
    slots[id] = { value: null, locked: false };
  });
  return slots;
}

export function createDefaultState(): PersistedStateV1 {
  return {
    version: 1,
    lists: cloneDefaultLists(),
    knownDefaults: cloneDefaultLists(),
    slots: createDefaultSlots(),
    history: [],
    themeId: DEFAULT_THEME_ID,
    pinned: false,
    companyEnabled: true,
  };
}
