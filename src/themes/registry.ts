import type { ThemeDefinition } from './types';
import { plainTheme } from './plain';

export const DEFAULT_THEME_ID = plainTheme.id;

const themes: Record<string, ThemeDefinition> = {
  [plainTheme.id]: plainTheme,
};

export function getTheme(id: string): ThemeDefinition {
  return themes[id] ?? themes[DEFAULT_THEME_ID];
}

export function listThemes(): ThemeDefinition[] {
  return Object.values(themes);
}
