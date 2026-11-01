export interface PinAdapter {
  canPin: boolean;
  setPinned(on: boolean): Promise<void>;
}
