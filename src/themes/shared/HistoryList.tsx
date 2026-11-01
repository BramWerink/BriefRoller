import { formatHistoryLine } from '../../core';
import type { PanelProps } from './types';

interface Props extends PanelProps {
  showBack: boolean;
}

export function HistoryList({ vm, actions, styles, showBack }: Props) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>History</h2>
      {vm.history.length === 0 ? (
        <p className={styles.muted}>No rolls yet.</p>
      ) : (
        <ol className={styles.historyList}>
          {vm.history.map((entry, index) => (
            <li key={entry.id}>
              <button
                type="button"
                className={styles.historyItem}
                onClick={() => actions.restoreFromHistory(entry.id)}
              >
                {/* Newest is listed first but numbered last, so the oldest shown is 01. */}
                <span className={styles.historyIndex}>
                  {String(vm.history.length - index).padStart(2, '0')}
                </span>{' '}
                {formatHistoryLine(entry.values)}
              </button>
            </li>
          ))}
        </ol>
      )}
      <div className={styles.panelActions}>
        <button
          type="button"
          className={styles.key}
          disabled={vm.history.length === 0}
          onClick={actions.clearHistory}
        >
          Clear
        </button>
        {showBack && (
          <button type="button" className={styles.key} onClick={actions.closePanel}>
            Back <kbd>Esc</kbd>
          </button>
        )}
      </div>
    </div>
  );
}
