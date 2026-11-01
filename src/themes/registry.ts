import type { ThemeDefinition } from './types';
import { DEFAULT_THEME_ID } from '../core';
import { cabinTheme } from './cabin';
import { plainTheme } from './plain';

const themes: Record<string, ThemeDefinition> = {
  [cabinTheme.id]: cabinTheme,
  [plainTheme.id]: plainTheme,
};

export function getTheme(id: string): ThemeDefinition {
  return themes[id] ?? themes[DEFAULT_THEME_ID];
}

export function listThemes(): ThemeDefinition[] {
  return Object.values(themes);
}
