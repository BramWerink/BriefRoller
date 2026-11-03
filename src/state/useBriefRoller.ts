import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  activeSlotIds,
  buildBriefSegments,
  buildBriefSentence,
  loadState,
  saveState,
  rollUnlockedSlots,
  pushHistoryEntry,
  addListItem as addListItemCore,
  removeListItem as removeListItemCore,
  resetList as resetListCore,
  REQUIRED_SLOT_ID,
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
  company: 1050,
};
const COPIED_FLASH_MS = 1400;

type Action =
  | { type: 'COMMIT_SLOT'; slot: SlotId; value: string | null }
  | { type: 'COMMIT_ALL'; values: Record<SlotId, string | null> }
  | { type: 'TOGGLE_LOCK'; slot: SlotId }
  | { type: 'PUSH_HISTORY'; values: Partial<Record<SlotId, string>>; id: string; rolledAt: number }
  | { type: 'RESTORE_HISTORY'; id: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'ADD_LIST_ITEM'; slot: SlotId; value: string }
  | { type: 'REMOVE_LIST_ITEM'; slot: SlotId; value: string }
  | { type: 'RESET_LIST'; slot: SlotId }
  | { type: 'SET_THEME'; id: string }
  | { type: 'SET_PINNED'; pinned: boolean }
  | { type: 'SET_SLOT_ENABLED'; slot: SlotId; enabled: boolean };

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
      // Older or company-disabled entries have no company value; leave that slot as it is.
      SLOT_IDS.forEach((id) => {
        const value = entry.values[id];
        if (value !== undefined) slots[id] = { ...slots[id], value };
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
    case 'SET_SLOT_ENABLED': {
      if (action.slot === REQUIRED_SLOT_ID) return state;
      return {
        ...state,
        enabledSlots: { ...state.enabledSlots, [action.slot]: action.enabled },
      };
    }
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
    company: false,
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
      // A cancelled roll never finishes, so let a remount (StrictMode in dev) roll again.
      rollingRef.current = false;
    },
    [],
  );

  const settleRollValues = useCallback(
    (finalValues: Record<SlotId, string | null>, activeIds: SlotId[]) => {
      const complete = activeIds.every((id) => finalValues[id] !== null);
      if (complete) {
        const values: Partial<Record<SlotId, string>> = {};
        activeIds.forEach((id) => {
          values[id] = finalValues[id]!;
        });
        apply({
          type: 'PUSH_HISTORY',
          values,
          id: crypto.randomUUID(),
          rolledAt: Date.now(),
        });
        setRollCount((count) => count + 1);
      }
    },
    [apply],
  );

  /**
   * Rolls `onlyIds` (default: every active, unlocked slot). Passing a narrower list — as the
   * open-on-a-brief effect does for a newly-active slot — rerolls just those, leaving an
   * already-set brief alone; completeness and history still cover every active slot.
   */
  const roll = useCallback(
    (onlyIds?: SlotId[]) => {
      if (rollingRef.current) return;

      const current = stateRef.current;
      const fullActiveIds = activeSlotIds(current.enabledSlots);
      const targetIds = onlyIds ?? fullActiveIds;
      const finalValues = rollUnlockedSlots(current.lists, current.slots, targetIds);

      if (prefersReducedMotion()) {
        apply({ type: 'COMMIT_ALL', values: finalValues });
        settleRollValues(finalValues, fullActiveIds);
        return;
      }

      const animatingSlots = targetIds.filter(
        (id) => !current.slots[id].locked && current.lists[id].length > 0,
      );

      if (animatingSlots.length === 0) {
        apply({ type: 'COMMIT_ALL', values: finalValues });
        settleRollValues(finalValues, fullActiveIds);
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
            settleRollValues(finalValues, fullActiveIds);
          }
        }, STAGGER_MS[id]);
        timers.current.push(timeoutId);
      });
    },
    [apply, settleRollValues],
  );

  // Open on a brief instead of empty slots: fill in whichever active slots have no value yet
  // (e.g. a newly enabled company, or a first-ever visit) without touching an already-set brief.
  useEffect(() => {
    const { lists, slots, enabledSlots } = stateRef.current;
    const missing = activeSlotIds(enabledSlots).filter(
      (id) => slots[id].value === null && lists[id].length > 0,
    );
    if (missing.length > 0) roll(missing);
  }, [roll]);

  const openPanel = useCallback((next: Panel) => setPanel(next), []);
  const closePanel = useCallback(() => setPanel('main'), []);
  const togglePanel = useCallback(
    (next: Exclude<Panel, 'main'>) => setPanel((current) => (current === next ? 'main' : next)),
    [],
  );

  const toggleLock = useCallback(
    (slot: SlotId) => {
      apply({ type: 'TOGGLE_LOCK', slot });
    },
    [apply],
  );

  const copyBrief = useCallback(async () => {
    if (rollingRef.current) return;
    const { lists, slots, enabledSlots } = stateRef.current;
    if (
      !activeSlotIds(enabledSlots).every((id) => lists[id].length > 0 && slots[id].value !== null)
    )
      return;
    const text = buildBriefSentence(lists, slots, enabledSlots);
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

  const restoreFromHistory = useCallback(
    (id: string) => {
      apply({ type: 'RESTORE_HISTORY', id });
    },
    [apply],
  );

  const clearHistory = useCallback(() => {
    apply({ type: 'CLEAR_HISTORY' });
  }, [apply]);

  const addListItem = useCallback(
    (slot: SlotId, value: string) => {
      const { result } = addListItemCore(stateRef.current.lists[slot], value);
      if (result.ok) apply({ type: 'ADD_LIST_ITEM', slot, value });
      return result;
    },
    [apply],
  );

  const removeListItem = useCallback(
    (slot: SlotId, value: string) => {
      apply({ type: 'REMOVE_LIST_ITEM', slot, value });
    },
    [apply],
  );

  const resetList = useCallback(
    (slot: SlotId) => {
      apply({ type: 'RESET_LIST', slot });
    },
    [apply],
  );

  const setTheme = useCallback(
    (id: string) => {
      apply({ type: 'SET_THEME', id });
    },
    [apply],
  );

  const setSlotEnabled = useCallback(
    (slot: SlotId, enabled: boolean) => {
      apply({ type: 'SET_SLOT_ENABLED', slot, enabled });
    },
    [apply],
  );

  const setPinned = useCallback(
    async (on: boolean) => {
      if (!pinAdapter.canPin) return;
      try {
        await pinAdapter.setPinned(on);
      } catch {
        // Leave the stored state alone so the Pin key never shows a pin that didn't happen.
        return;
      }
      apply({ type: 'SET_PINNED', pinned: on });
    },
    [apply],
  );

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
    enabledSlots: state.enabledSlots,
    briefText: buildBriefSentence(state.lists, state.slots, state.enabledSlots),
    briefSegments: buildBriefSegments(state.lists, state.slots, state.enabledSlots),
    canCopy:
      !isRolling &&
      activeSlotIds(state.enabledSlots).every(
        (id) => state.lists[id].length > 0 && state.slots[id].value !== null,
      ),
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
    setSlotEnabled,
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
