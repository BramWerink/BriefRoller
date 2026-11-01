import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultState, saveState } from '../core';

const setPinned = vi.fn<(on: boolean) => Promise<void>>();

vi.mock('../platform', () => ({
  pinAdapter: { canPin: true, setPinned: (on: boolean) => setPinned(on) },
}));

const { useBriefRoller } = await import('./useBriefRoller');

describe('useBriefRoller with a desktop pin adapter', () => {
  beforeEach(() => {
    setPinned.mockReset();
    setPinned.mockResolvedValue();
  });

  it('pins the window and remembers it', async () => {
    const { result } = renderHook(() => useBriefRoller());
    expect(result.current[0].canPin).toBe(true);

    await act(() => result.current[1].setPinned(true));

    expect(setPinned).toHaveBeenCalledWith(true);
    expect(result.current[0].pinned).toBe(true);
  });

  it('re-applies a saved pin when the app starts', () => {
    const state = createDefaultState();
    state.pinned = true;
    saveState(state);

    renderHook(() => useBriefRoller());

    expect(setPinned).toHaveBeenCalledWith(true);
  });

  it('stays unpinned when the window refuses to pin', async () => {
    setPinned.mockRejectedValue(new Error('not allowed'));
    const { result } = renderHook(() => useBriefRoller());

    await act(() => result.current[1].setPinned(true));

    expect(result.current[0].pinned).toBe(false);
  });

  it('clears a saved pin that can no longer be applied', async () => {
    setPinned.mockRejectedValue(new Error('not allowed'));
    const state = createDefaultState();
    state.pinned = true;
    saveState(state);

    const { result } = renderHook(() => useBriefRoller());

    await waitFor(() => expect(result.current[0].pinned).toBe(false));
  });
});
