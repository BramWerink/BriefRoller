import { useEffect, useRef } from 'react';
import { activeSlotIds } from '../core';
import type { BriefRollerActions, BriefRollerViewModel } from '../state/types';

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const ACTIVATABLE = 'button, a[href], [role="button"], [role="tab"]';

export function useKeyboardShortcuts(vm: BriefRollerViewModel, actions: BriefRollerActions) {
  const latest = useRef({ vm, actions });
  latest.current = { vm, actions };

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const { vm, actions } = latest.current;
      const target = event.target instanceof HTMLElement ? event.target : null;

      if (event.key === 'Escape') {
        if (vm.panel !== 'main') {
          event.preventDefault();
          actions.closePanel();
        }
        return;
      }

      const isTyping =
        target !== null && (TYPING_TAGS.has(target.tagName) || target.isContentEditable);
      if (isTyping) return;

      switch (event.key) {
        case ' ':
        case 'Enter':
          // Let a focused button handle its own activation.
          if (target?.closest(ACTIVATABLE)) return;
          event.preventDefault();
          actions.roll();
          return;
        case '1':
        case '2':
        case '3':
        case '4': {
          event.preventDefault();
          const ids = activeSlotIds(vm.companyEnabled);
          const id = ids[Number(event.key) - 1];
          if (id) actions.toggleLock(id);
          return;
        }
        case 'c':
        case 'C':
          event.preventDefault();
          void actions.copyBrief();
          return;
        case 'h':
        case 'H':
          event.preventDefault();
          actions.togglePanel('history');
          return;
        case 'e':
        case 'E':
          // Without this, the "e" is typed into the edit field that just took focus.
          event.preventDefault();
          actions.togglePanel('edit');
          return;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
