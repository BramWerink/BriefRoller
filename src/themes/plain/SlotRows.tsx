import { SLOT_IDS, slotLabel } from '../../core';
import type { BriefRollerActions, BriefRollerViewModel } from '../../state/types';
import styles from './plain.module.css';

interface Props {
  vm: BriefRollerViewModel;
  actions: BriefRollerActions;
}

export function SlotRows({ vm, actions }: Props) {
  return (
    <ol className={styles.slots}>
      {SLOT_IDS.map((id, index) => {
        const slot = vm.slots[id];
        const isEmptyList = vm.lists[id].length === 0;
        const label = slotLabel(id);
        const value = isEmptyList ? '—' : (slot.value ?? '—');

        return (
          <li key={id} className={styles.slot}>
            <span className={styles.slotLabel}>
              {index + 1} {label}
            </span>
            <span
              className={styles.slotValue}
              data-rolling={vm.rollingSlots[id] || undefined}
            >
              {value}
            </span>
            <button
              type="button"
              className={styles.lockKey}
              aria-pressed={slot.locked}
              aria-label={`Lock ${label.toLowerCase()}`}
              disabled={isEmptyList || slot.value === null}
              onClick={() => actions.toggleLock(id)}
            >
              <span aria-hidden="true">{slot.locked ? 'Locked' : 'Lock'}</span>
              <kbd aria-hidden="true">{index + 1}</kbd>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
