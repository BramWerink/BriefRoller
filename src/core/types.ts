export type SlotId = 'style' | 'deliverable' | 'client' | 'company';

/** Every slot that exists, including company whether or not it's currently rolled. */
export const SLOT_IDS: SlotId[] = ['style', 'deliverable', 'client', 'company'];

/** Slots that are always part of the brief; company is optional, see `activeSlotIds`. */
export const CORE_SLOT_IDS: SlotId[] = ['style', 'deliverable', 'client'];

/** The slots that currently take part in rolling, the brief and history. */
export function activeSlotIds(companyEnabled: boolean): SlotId[] {
  return companyEnabled ? SLOT_IDS : CORE_SLOT_IDS;
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
  /** Whether the brief also rolls a company name. On by default. */
  companyEnabled: boolean;
}

export type AddListItemResult = { ok: true } | { ok: false; reason: string };
