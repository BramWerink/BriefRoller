export type SlotId = 'style' | 'deliverable' | 'client';

export const SLOT_IDS: SlotId[] = ['style', 'deliverable', 'client'];

export interface SlotState {
  value: string | null;
  locked: boolean;
}

export type SlotsState = Record<SlotId, SlotState>;

export type BriefListsState = Record<SlotId, string[]>;

export interface HistoryEntry {
  id: string;
  values: Record<SlotId, string>;
  rolledAt: number;
}

export interface PersistedStateV1 {
  version: 1;
  lists: BriefListsState;
  /** Default items this browser has already been offered, so deleted ones stay deleted. */
  knownDefaults: BriefListsState;
  slots: SlotsState;
  history: HistoryEntry[];
  themeId: string;
  pinned: boolean;
}

export type AddListItemResult = { ok: true } | { ok: false; reason: string };
