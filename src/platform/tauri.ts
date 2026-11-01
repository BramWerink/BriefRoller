import { getCurrentWindow } from '@tauri-apps/api/window';
import type { PinAdapter } from './types';

export const tauriPinAdapter: PinAdapter = {
  canPin: true,
  setPinned: (on) => getCurrentWindow().setAlwaysOnTop(on),
};
