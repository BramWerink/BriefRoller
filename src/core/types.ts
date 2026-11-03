export type SlotId = 'style' | 'deliverable' | 'client' | 'company';

/** Every slot that exists, including ones currently switched off. */
export const SLOT_IDS: SlotId[] = ['style', 'deliverable', 'client', 'company'];

/** The brief always needs a subject; Deliverable can't be switched off. */
export const REQUIRED_SLOT_ID: SlotId = 'deliverable';

/** Per-slot on/off switches; Deliverable is always on regardless of its stored value. */
export type EnabledSlots = Record<SlotId, boolean>;

/** The slots that currently take part in rolling, the brief and history. */
export function activeSlotIds(enabledSlots: EnabledSlots): SlotId[] {
  return SLOT_IDS.filter((id) => id === REQUIRED_SLOT_ID || enabledSlots[id]);
}

export interface SlotState {
  value: string | null;
  locked: boolean;
}

export type SlotsState = Record<SlotId, SlotState>;

export type BriefListsState = Record<SlotId, string[]>;

export interface HistoryEntry {
  id: string;
  /** Only the slots active when this was rolled; company is absent from older/disabled entries. */
  values: Partial<Record<SlotId, string>>;
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
  /** Which slots roll with the brief. Deliverable is always on; the rest default to on. */
  enabledSlots: EnabledSlots;
}

export type AddListItemResult = { ok: true } | { ok: false; reason: string };
