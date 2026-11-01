import type { SkinProps } from '../types';
import { SlotRows } from './SlotRows';
import { HistoryList } from './HistoryList';
import { EditLists } from './EditLists';
import styles from './plain.module.css';

const PIN_UNAVAILABLE = 'Available in the desktop app';

export function PlainSkin({ vm, actions, layout }: SkinProps) {
  const isWide = layout === 'wide';
  const showHistoryPanel = vm.panel === 'history' && !isWide;
  const showEdit = vm.panel === 'edit';

  const briefLine = vm.justCopied
    ? 'Copied!'
    : vm.isRolling
      ? 'Rolling…'
      : vm.briefText || 'Press Roll for a brief';

  return (
    <div className={`${styles.device} ${isWide ? styles.wide : styles.mini}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Brief Roller</h1>
          {isWide && <p className={styles.tagline}>Roll a random design brief</p>}
        </div>
        <nav className={styles.headerKeys} aria-label="Panels">
          {!isWide && (
            <button
              type="button"
              className={styles.key}
              aria-pressed={vm.panel === 'history'}
              onClick={() => actions.togglePanel('history')}
            >
              History <kbd>H</kbd>
            </button>
          )}
          <button
            type="button"
            className={styles.key}
            aria-pressed={vm.panel === 'edit'}
            onClick={() => actions.togglePanel('edit')}
          >
            Lists <kbd>E</kbd>
          </button>
          <button
            type="button"
            className={styles.key}
            aria-pressed={vm.pinned}
            disabled={!vm.canPin}
            title={vm.canPin ? 'Keep this window on top' : PIN_UNAVAILABLE}
            onClick={() => actions.setPinned(!vm.pinned)}
          >
            Pin
          </button>
        </nav>
      </header>

      <div className={styles.body}>
        <section className={styles.screen} aria-label="Brief">
          {showEdit ? (
            <EditLists vm={vm} actions={actions} />
          ) : showHistoryPanel ? (
            <HistoryList vm={vm} actions={actions} showBack />
          ) : (
            <>
              <SlotRows vm={vm} actions={actions} />
              <p className={styles.brief} aria-live="polite">
                {briefLine}
              </p>
            </>
          )}
        </section>

        {isWide && (
          <aside className={styles.historyColumn} aria-label="History">
            <HistoryList vm={vm} actions={actions} showBack={false} />
          </aside>
        )}
      </div>

      <div className={styles.actionsRow}>
        <button
          type="button"
          className={`${styles.key} ${styles.copyKey}`}
          onClick={() => void actions.copyBrief()}
          disabled={!vm.canCopy}
        >
          Copy <kbd>C</kbd>
        </button>
        <button
          type="button"
          className={styles.rollKey}
          data-pressed={vm.isRolling || undefined}
          aria-disabled={vm.isRolling}
          onClick={actions.roll}
        >
          Roll
        </button>
      </div>
    </div>
  );
}
