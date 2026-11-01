import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  buildBriefSentence,
  loadState,
  saveState,
  rollUnlockedSlots,
  pushHistoryEntry,
  addListItem as addListItemCore,
  removeListItem as removeListItemCore,
  resetList as resetListCore,
  SLOT_IDS,
} from '../core';
import type { PersistedStateV1, SlotId, SlotsState } from '../core';
import { pinAdapter } from '../platform';
import type { BriefRollerActions, BriefRollerViewModel, Panel } from './types';

const FLICKER_INTERVAL_MS = 60;
const STAGGER_MS: Record<SlotId, number> = {
  style: 600,
  deliverable: 750,
  client: 900,
};
const COPIED_FLASH_MS = 1400;

type Action =
  | { type: 'COMMIT_SLOT'; slot: SlotId; value: string | null }
  | { type: 'COMMIT_ALL'; values: Record<SlotId, string | null> }
  | { type: 'TOGGLE_LOCK'; slot: SlotId }
  | { type: 'PUSH_HISTORY'; values: Record<SlotId, string>; id: string; rolledAt: number }
  | { type: 'RESTORE_HISTORY'; id: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'ADD_LIST_ITEM'; slot: SlotId; value: string }
  | { type: 'REMOVE_LIST_ITEM'; slot: SlotId; value: string }
  | { type: 'RESET_LIST'; slot: SlotId }
  | { type: 'SET_THEME'; id: string }
  | { type: 'SET_PINNED'; pinned: boolean };

function reducer(state: PersistedStateV1, action: Action): PersistedStateV1 {
  switch (action.type) {
    case 'COMMIT_SLOT':
      return {
        ...state,
        slots: {
          ...state.slots,
          [action.slot]: { ...state.slots[action.slot], value: action.value },
        },
      };
    case 'COMMIT_ALL': {
      const slots: SlotsState = { ...state.slots };
      SLOT_IDS.forEach((id) => {
        slots[id] = { ...slots[id], value: action.values[id] };
      });
      return { ...state, slots };
    }
    case 'TOGGLE_LOCK': {
      const slot = state.slots[action.slot];
      if (slot.value === null) return state;
      return {
        ...state,
        slots: { ...state.slots, [action.slot]: { ...slot, locked: !slot.locked } },
      };
    }
    case 'PUSH_HISTORY':
      return {
        ...state,
        history: pushHistoryEntry(state.history, action.values, () => action.id, action.rolledAt),
      };
    case 'RESTORE_HISTORY': {
      const entry = state.history.find((item) => item.id === action.id);
      if (!entry) return state;
      const slots: SlotsState = { ...state.slots };
      SLOT_IDS.forEach((id) => {
        slots[id] = { ...slots[id], value: entry.values[id] };
      });
      return { ...state, slots };
    }
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'ADD_LIST_ITEM': {
      const { list, result } = addListItemCore(state.lists[action.slot], action.value);
      if (!result.ok) return state;
      return { ...state, lists: { ...state.lists, [action.slot]: list } };
    }
    case 'REMOVE_LIST_ITEM': {
      const list = removeListItemCore(state.lists[action.slot], action.value);
      const lists = { ...state.lists, [action.slot]: list };
      if (list.length > 0) return { ...state, lists };
      return {
        ...state,
        lists,
        slots: { ...state.slots, [action.slot]: { value: null, locked: false } },
      };
    }
    case 'RESET_LIST':
      return { ...state, lists: { ...state.lists, [action.slot]: resetListCore(action.slot) } };
    case 'SET_THEME':
      return { ...state, themeId: action.id };
    case 'SET_PINNED':
      return { ...state, pinned: action.pinned };
    default:
      return state;
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function useBriefRoller(): [BriefRollerViewModel, BriefRollerActions] {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [rollingSlots, setRollingSlots] = useState<Record<SlotId, boolean>>({
    style: false,
    deliverable: false,
    client: false,
  });
  const [flicker, setFlicker] = useState<Partial<Record<SlotId, string>>>({});
  const [justCopied, setJustCopied] = useState(false);
  const [rollCount, setRollCount] = useState(0);
  const [panel, setPanel] = useState<Panel>('main');

  const timers = useRef<number[]>([]);
  const rollingRef = useRef(false);
  const copyTimer = useRef<number | undefined>(undefined);
  // Mirrors the reducer synchronously so actions fired in the same task
  // (e.g. "lock 1" then "roll") see each other's changes before React renders.
  const stateRef = useRef(state);
  const apply = useCallback((action: Action) => {
    stateRef.current = reducer(stateRef.current, action);
    dispatch(action);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(
    () => () => {
      // Interval and timeout ids share one pool, so clearInterval covers both.
      timers.current.forEach((id) => window.clearInterval(id));
      window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const settleRollValues = useCallback((finalValues: Record<SlotId, string | null>) => {
    const complete = SLOT_IDS.every((id) => finalValues[id] !== null);
    if (complete) {
      apply({
        type: 'PUSH_HISTORY',
        values: finalValues as Record<SlotId, string>,
        id: crypto.randomUUID(),
        rolledAt: Date.now(),
      });
      setRollCount((count) => count + 1);
    }
  }, [apply]);

  const roll = useCallback(() => {
    if (rollingRef.current) return;

    const current = stateRef.current;
    const finalValues = rollUnlockedSlots(current.lists, current.slots);

    if (prefersReducedMotion()) {
      apply({ type: 'COMMIT_ALL', values: finalValues });
      settleRollValues(finalValues);
      return;
    }

    const animatingSlots = SLOT_IDS.filter(
      (id) => !current.slots[id].locked && current.lists[id].length > 0,
    );

    if (animatingSlots.length === 0) {
      apply({ type: 'COMMIT_ALL', values: finalValues });
      settleRollValues(finalValues);
      return;
    }

    setRollingSlots((prev) => {
      const next = { ...prev };
      animatingSlots.forEach((id) => {
        next[id] = true;
      });
      return next;
    });

    rollingRef.current = true;
    timers.current = [];
    let remaining = animatingSlots.length;

    animatingSlots.forEach((id) => {
      const list = current.lists[id];
      const flickerOnce = () => {
        const randomItem = list[Math.floor(Math.random() * list.length)];
        setFlicker((prev) => ({ ...prev, [id]: randomItem }));
      };
      flickerOnce();
      const intervalId = window.setInterval(flickerOnce, FLICKER_INTERVAL_MS);
      timers.current.push(intervalId);

      const timeoutId = window.setTimeout(() => {
        window.clearInterval(intervalId);
        apply({ type: 'COMMIT_SLOT', slot: id, value: finalValues[id] });
        setFlicker((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setRollingSlots((prev) => ({ ...prev, [id]: false }));

        remaining -= 1;
        if (remaining === 0) {
          rollingRef.current = false;
          settleRollValues(finalValues);
        }
      }, STAGGER_MS[id]);
      timers.current.push(timeoutId);
    });
  }, [apply, settleRollValues]);

  const openPanel = useCallback((next: Panel) => setPanel(next), []);
  const closePanel = useCallback(() => setPanel('main'), []);
  const togglePanel = useCallback(
    (next: Exclude<Panel, 'main'>) => setPanel((current) => (current === next ? 'main' : next)),
    [],
  );

  const toggleLock = useCallback((slot: SlotId) => {
    apply({ type: 'TOGGLE_LOCK', slot });
  }, [apply]);

  const copyBrief = useCallback(async () => {
    if (rollingRef.current) return;
    const { lists, slots } = stateRef.current;
    if (!SLOT_IDS.every((id) => lists[id].length > 0 && slots[id].value !== null)) return;
    const text = buildBriefSentence(lists, slots);
    if (!text) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setJustCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setJustCopied(false), COPIED_FLASH_MS);
  }, []);

  const restoreFromHistory = useCallback((id: string) => {
    apply({ type: 'RESTORE_HISTORY', id });
  }, [apply]);

  const clearHistory = useCallback(() => {
    apply({ type: 'CLEAR_HISTORY' });
  }, [apply]);

  const addListItem = useCallback((slot: SlotId, value: string) => {
    const { result } = addListItemCore(stateRef.current.lists[slot], value);
    if (result.ok) apply({ type: 'ADD_LIST_ITEM', slot, value });
    return result;
  }, [apply]);

  const removeListItem = useCallback((slot: SlotId, value: string) => {
    apply({ type: 'REMOVE_LIST_ITEM', slot, value });
  }, [apply]);

  const resetList = useCallback((slot: SlotId) => {
    apply({ type: 'RESET_LIST', slot });
  }, [apply]);

  const setTheme = useCallback((id: string) => {
    apply({ type: 'SET_THEME', id });
  }, [apply]);

  const setPinned = useCallback(async (on: boolean) => {
    if (!pinAdapter.canPin) return;
    try {
      await pinAdapter.setPinned(on);
    } catch {
      // Leave the stored state alone so the Pin key never shows a pin that didn't happen.
      return;
    }
    apply({ type: 'SET_PINNED', pinned: on });
  }, [apply]);

  useEffect(() => {
    if (pinAdapter.canPin && stateRef.current.pinned) {
      pinAdapter.setPinned(true).catch(() => apply({ type: 'SET_PINNED', pinned: false }));
    }
  }, [apply]);

  const isRolling = SLOT_IDS.some((id) => rollingSlots[id]);

  const displaySlots: SlotsState = useMemo(() => {
    const result = { ...state.slots };
    SLOT_IDS.forEach((id) => {
      if (rollingSlots[id] && flicker[id] !== undefined) {
        result[id] = { ...result[id], value: flicker[id]! };
      }
    });
    return result;
  }, [state.slots, rollingSlots, flicker]);

  const viewModel: BriefRollerViewModel = {
    panel,
    slots: displaySlots,
    lists: state.lists,
    history: state.history,
    themeId: state.themeId,
    pinned: state.pinned,
    canPin: pinAdapter.canPin,
    isRolling,
    rollingSlots,
    briefText: buildBriefSentence(state.lists, state.slots),
    canCopy:
      !isRolling &&
      SLOT_IDS.every((id) => state.lists[id].length > 0 && state.slots[id].value !== null),
    rollCount,
    justCopied,
  };

  const actions: BriefRollerActions = {
    openPanel,
    closePanel,
    togglePanel,
    roll,
    toggleLock,
    copyBrief,
    restoreFromHistory,
    clearHistory,
    addListItem,
    removeListItem,
    resetList,
    setTheme,
    setPinned,
  };

  return [viewModel, actions];
}
