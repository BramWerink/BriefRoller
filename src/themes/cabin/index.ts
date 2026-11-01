import '@fontsource/oswald/500.css';
import '@fontsource/oswald/600.css';
import '@fontsource/karla/500.css';
import './tokens.css';
import type { ThemeDefinition } from '../types';
import { CabinSkin } from './CabinSkin';

export const cabinTheme: ThemeDefinition = {
  id: 'cabin',
  name: 'The Design Cabin',
  miniSize: { w: 360, h: 640 },
  Skin: CabinSkin,
};
