import type { AddListItemResult, HistoryEntry, SlotId, SlotsState, BriefListsState } from '../core';

export type Panel = 'main' | 'history' | 'edit';

export interface BriefRollerViewModel {
  panel: Panel;
  slots: SlotsState;
  lists: BriefListsState;
  history: HistoryEntry[];
  themeId: string;
  pinned: boolean;
  canPin: boolean;
  isRolling: boolean;
  rollingSlots: Record<SlotId, boolean>;
  briefText: string;
  /** True when every slot has a value, so the brief is a full sentence. */
  canCopy: boolean;
  rollCount: number;
  justCopied: boolean;
}

export interface BriefRollerActions {
  openPanel(panel: Panel): void;
  closePanel(): void;
  togglePanel(panel: Exclude<Panel, 'main'>): void;
  roll(): void;
  toggleLock(slot: SlotId): void;
  copyBrief(): Promise<void>;
  restoreFromHistory(id: string): void;
  clearHistory(): void;
  addListItem(slot: SlotId, value: string): AddListItemResult;
  removeListItem(slot: SlotId, value: string): void;
  resetList(slot: SlotId): void;
  setTheme(id: string): void;
  setPinned(on: boolean): Promise<void>;
}
