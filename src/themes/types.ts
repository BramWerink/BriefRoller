import type { ComponentType } from 'react';
import type { BriefRollerActions, BriefRollerViewModel } from '../state/types';

export type Layout = 'mini' | 'wide';

/** What every skin receives. Skins render this and call actions — no business logic. */
export interface SkinProps {
  vm: BriefRollerViewModel;
  actions: BriefRollerActions;
  layout: Layout;
}

export interface ThemeDefinition {
  /** Matches the `[data-theme="<id>"]` selector its tokens.css is scoped under. */
  id: string;
  name: string;
  /** Preferred window size for the compact layout (used by the future desktop build). */
  miniSize: { w: number; h: number };
  Skin: ComponentType<SkinProps>;
}
