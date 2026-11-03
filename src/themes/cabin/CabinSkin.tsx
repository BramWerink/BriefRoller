import type { SkinProps } from '../types';
import { HistoryList } from '../shared/HistoryList';
import { EditLists } from '../shared/EditLists';
import { SlotCards } from './SlotCards';
import { BriefCard } from './BriefCard';
import { DieIcon, HistoryIcon, ListsIcon, PinIcon } from './icons';
import styles from './cabin.module.css';

const PIN_UNAVAILABLE = 'Available in the desktop app';

export function CabinSkin({ vm, actions, layout }: SkinProps) {
  const isWide = layout === 'wide';
  const showHistoryPanel = vm.panel === 'history' && !isWide;
  const showEdit = vm.panel === 'edit';

  return (
    <div className={styles.device}>
      <header className={styles.header}>
        <h1 className={styles.title}>The Design Cabin</h1>
        <nav className={styles.headerKeys} aria-label="Panels">
          {!isWide && (
            <button
              type="button"
              className={styles.iconKey}
              aria-label="History"
              title="History (H)"
              aria-pressed={vm.panel === 'history'}
              onClick={() => actions.togglePanel('history')}
            >
              <HistoryIcon />
            </button>
          )}
          <button
            type="button"
            className={styles.iconKey}
            aria-label="Lists"
            title="Edit lists (E)"
            aria-pressed={vm.panel === 'edit'}
            onClick={() => actions.togglePanel('edit')}
          >
            <ListsIcon />
          </button>
          <button
            type="button"
            className={styles.iconKey}
            aria-label="Pin"
            aria-pressed={vm.pinned}
            disabled={!vm.canPin}
            title={vm.canPin ? 'Keep this window on top' : PIN_UNAVAILABLE}
            onClick={() => actions.setPinned(!vm.pinned)}
          >
            <PinIcon />
          </button>
        </nav>
      </header>

      <div className={styles.body}>
        <section className={styles.main} aria-label="Brief">
          {showEdit ? (
            <div className={styles.sheet}>
              <EditLists vm={vm} actions={actions} styles={styles} />
            </div>
          ) : showHistoryPanel ? (
            <div className={styles.sheet}>
              <HistoryList vm={vm} actions={actions} styles={styles} showBack />
            </div>
          ) : (
            <>
              <SlotCards vm={vm} actions={actions} />
              <BriefCard vm={vm} actions={actions} />
            </>
          )}

          <button
            type="button"
            className={styles.rollKey}
            data-pressed={vm.isRolling || undefined}
            aria-disabled={vm.isRolling}
            onClick={() => actions.roll()}
          >
            <DieIcon />
            <span className={styles.rollLabel}>Roll</span>
          </button>
        </section>

        {isWide && (
          <aside className={`${styles.sheet} ${styles.historyColumn}`} aria-label="History">
            <HistoryList vm={vm} actions={actions} styles={styles} showBack={false} />
          </aside>
        )}
      </div>
    </div>
  );
}
