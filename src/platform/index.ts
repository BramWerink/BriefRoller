import { isTauri } from '@tauri-apps/api/core';
import type { PinAdapter } from './types';
import { browserPinAdapter } from './browser';
import { tauriPinAdapter } from './tauri';

export type { PinAdapter } from './types';

export const pinAdapter: PinAdapter = isTauri() ? tauriPinAdapter : browserPinAdapter;
