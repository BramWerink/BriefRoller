import type { PinAdapter } from './types';

// A browser tab can't keep itself above other windows, so pinning is desktop-only.
export const browserPinAdapter: PinAdapter = {
  canPin: false,
  setPinned: async () => {},
};
