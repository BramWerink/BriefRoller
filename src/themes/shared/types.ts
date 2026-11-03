import type { BriefRollerActions, BriefRollerViewModel } from '../../state/types';

/**
 * Class names a skin's CSS module provides for the shared panels:
 * panel, panelTitle, panelActions, muted, key, historyList, historyItem, historyIndex,
 * tabs, tab, toggleRow, addForm, input, error, itemList, item, removeKey, visuallyHidden.
 */
export type PanelStyles = Readonly<Record<string, string>>;

export interface PanelProps {
  vm: BriefRollerViewModel;
  actions: BriefRollerActions;
  styles: PanelStyles;
}
