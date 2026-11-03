import { activeSlotIds, slotLabel } from '../../core';
import type { BriefRollerActions, BriefRollerViewModel } from '../../state/types';
import { LockClosedIcon, LockOpenIcon } from './icons';
import styles from './cabin.module.css';

/** Values longer than this get a smaller font so they fit the card. */
const LONG_VALUE = 14;

interface Props {
  vm: BriefRollerViewModel;
  actions: BriefRollerActions;
}

export function SlotCards({ vm, actions }: Props) {
  return (
    <ol className={styles.slots}>
      {activeSlotIds(vm.companyEnabled).map((id, index) => {
        const slot = vm.slots[id];
        const isEmptyList = vm.lists[id].length === 0;
        const label = slotLabel(id);
        const value = isEmptyList ? '—' : (slot.value ?? '—');

        return (
          <li key={id} className={styles.slot}>
            <div className={styles.slotCard}>
              <span className={styles.slotLabel}>{label}</span>
              <span
                className={styles.slotValue}
                data-rolling={vm.rollingSlots[id] || undefined}
                data-long={value.length > LONG_VALUE || undefined}
                title={value}
              >
                {value}
              </span>
            </div>
            <button
              type="button"
              className={styles.lockKey}
              aria-pressed={slot.locked}
              aria-label={`Lock ${label.toLowerCase()}`}
              title={`${slot.locked ? 'Unlock' : 'Lock'} ${label.toLowerCase()} (${index + 1})`}
              disabled={isEmptyList || slot.value === null}
              onClick={() => actions.toggleLock(id)}
            >
              {slot.locked ? <LockClosedIcon /> : <LockOpenIcon />}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
