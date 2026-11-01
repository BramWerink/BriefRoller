import './tokens.css';
import type { ThemeDefinition } from '../types';
import { PlainSkin } from './PlainSkin';

export const plainTheme: ThemeDefinition = {
  id: 'plain',
  name: 'Plain',
  miniSize: { w: 360, h: 480 },
  Skin: PlainSkin,
};
