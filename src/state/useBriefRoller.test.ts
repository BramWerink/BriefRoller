import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBriefRoller } from './useBriefRoller';
import { createDefaultState, saveState } from '../core';

function stubReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
}

/** A saved brief in every slot, so the hook doesn't roll on its own when it opens. */
function seedFilledSlots() {
  const state = createDefaultState();
  state.slots.style = { value: 'Coastal', locked: false };
  state.slots.deliverable = { value: 'Sticker', locked: false };
  state.slots.client = { value: 'Fish shop', locked: false };
  saveState(state);
}

describe('useBriefRoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    seedFilledSlots();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rolls once on open when a slot has no value yet', () => {
    saveState(createDefaultState());
    const { result } = renderHook(() => useBriefRoller());
    expect(result.current[0].isRolling).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const [vm] = result.current;
    expect(vm.isRolling).toBe(false);
    expect(vm.slots.style.value).not.toBeNull();
    expect(vm.slots.deliverable.value).not.toBeNull();
    expect(vm.slots.client.value).not.toBeNull();
    expect(vm.history).toHaveLength(1);
  });

  it('keeps the saved brief on open when every slot has a value', () => {
    const { result } = renderHook(() => useBriefRoller());
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current[0].isRolling).toBe(false);
    expect(result.current[0].briefText).toBe('Design a sticker in Coastal style for a fish shop');
    expect(result.current[0].history).toHaveLength(0);
  });

  it('rolls every slot and pushes exactly one history entry per roll', () => {
    const { result } = renderHook(() => useBriefRoller());

    act(() => result.current[1].roll());
    expect(result.current[0].isRolling).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const [vm] = result.current;
    expect(vm.isRolling).toBe(false);
    expect(vm.slots.style.value).not.toBeNull();
    expect(vm.slots.deliverable.value).not.toBeNull();
    expect(vm.slots.client.value).not.toBeNull();
    expect(vm.history).toHaveLength(1);
    expect(vm.history[0].values).toEqual({
      style: vm.slots.style.value,
      deliverable: vm.slots.deliverable.value,
      client: vm.slots.client.value,
    });
    expect(vm.briefText).toMatch(/^Design an? /);
  });

  it('settles slots in stagger order: style, then deliverable, then client', () => {
    const { result } = renderHook(() => useBriefRoller());
    act(() => result.current[1].roll());

    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(result.current[0].rollingSlots).toEqual({
      style: false,
      deliverable: true,
      client: true,
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current[0].rollingSlots).toEqual({
      style: false,
      deliverable: false,
      client: true,
    });
  });

  it('ignores roll() while a roll is in progress', () => {
    const { result } = renderHook(() => useBriefRoller());
    act(() => result.current[1].roll());
    act(() => result.current[1].roll());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current[0].history).toHaveLength(1);
  });

  it('never changes a locked slot', () => {
    const state = createDefaultState();
    state.slots.style = { value: 'Coastal', locked: true };
    saveState(state);

    const { result } = renderHook(() => useBriefRoller());
    for (let i = 0; i < 5; i++) {
      act(() => result.current[1].roll());
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current[0].slots.style.value).toBe('Coastal');
    }
  });

  it('respects a lock toggled in the same task as the roll', () => {
    const state = createDefaultState();
    state.slots.style = { value: 'Coastal', locked: false };
    state.slots.deliverable = { value: 'Sticker', locked: false };
    state.slots.client = { value: 'Fish shop', locked: false };
    saveState(state);

    const { result } = renderHook(() => useBriefRoller());
    act(() => {
      result.current[1].toggleLock('style');
      result.current[1].roll();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current[0].slots.style).toEqual({ value: 'Coastal', locked: true });
    expect(result.current[0].slots.deliverable.value).not.toBe('Sticker');
  });

  it('commits instantly when the user prefers reduced motion', () => {
    stubReducedMotion(true);
    const { result } = renderHook(() => useBriefRoller());
    act(() => result.current[1].roll());

    expect(result.current[0].isRolling).toBe(false);
    expect(result.current[0].slots.style.value).not.toBeNull();
    expect(result.current[0].history).toHaveLength(1);
  });

  it('restores history values but keeps current locks', () => {
    const state = createDefaultState();
    state.slots.style = { value: 'Coastal', locked: true };
    state.slots.deliverable = { value: 'Sticker', locked: false };
    state.slots.client = { value: 'Fish shop', locked: false };
    state.history = [
      {
        id: 'h1',
        values: { style: 'Brutalist', deliverable: 'Poster', client: 'Bakery' },
        rolledAt: 1,
      },
    ];
    saveState(state);

    const { result } = renderHook(() => useBriefRoller());
    act(() => result.current[1].restoreFromHistory('h1'));

    expect(result.current[0].slots.style).toEqual({ value: 'Brutalist', locked: true });
    expect(result.current[0].slots.client.value).toBe('Bakery');
  });

  it('empties and unlocks a slot when its last list item is removed', () => {
    const state = createDefaultState();
    state.lists.client = ['Bakery'];
    state.slots.client = { value: 'Bakery', locked: true };
    saveState(state);

    const { result } = renderHook(() => useBriefRoller());
    act(() => result.current[1].removeListItem('client', 'Bakery'));

    expect(result.current[0].slots.client).toEqual({ value: null, locked: false });
    expect(result.current[0].briefText).toBe('Add a client first');
  });

  it('does not lock an empty slot', () => {
    const state = createDefaultState();
    state.lists.style = [];
    saveState(state);
    const { result } = renderHook(() => useBriefRoller());
    act(() => result.current[1].toggleLock('style'));
    expect(result.current[0].slots.style.locked).toBe(false);
  });

  it('returns validation feedback from addListItem', () => {
    const { result } = renderHook(() => useBriefRoller());
    let outcome: ReturnType<(typeof result.current)[1]['addListItem']> | undefined;
    act(() => {
      outcome = result.current[1].addListItem('style', 'coastal');
    });
    expect(outcome?.ok).toBe(false);

    act(() => {
      outcome = result.current[1].addListItem('style', 'Solarpunk');
    });
    expect(outcome?.ok).toBe(true);
    expect(result.current[0].lists.style).toContain('Solarpunk');
  });

  it('persists state to localStorage', () => {
    const { result } = renderHook(() => useBriefRoller());
    act(() => result.current[1].addListItem('style', 'Solarpunk'));

    const { result: reloaded } = renderHook(() => useBriefRoller());
    expect(reloaded.current[0].lists.style).toContain('Solarpunk');
  });

  it('cannot pin in the browser', async () => {
    const { result } = renderHook(() => useBriefRoller());
    expect(result.current[0].canPin).toBe(false);
    await act(() => result.current[1].setPinned(true));
    expect(result.current[0].pinned).toBe(false);
  });
});
