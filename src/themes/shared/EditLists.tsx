import { useState, type FormEvent } from 'react';
import { MAX_ITEM_LENGTH, SLOT_IDS, slotLabel, type SlotId } from '../../core';
import type { PanelProps } from './types';

export function EditLists({ vm, actions, styles }: PanelProps) {
  const [tab, setTab] = useState<SlotId>('style');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const items = vm.lists[tab];
  const label = slotLabel(tab).toLowerCase();
  const inputId = 'edit-list-input';

  function selectTab(next: SlotId) {
    setTab(next);
    setDraft('');
    setError(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = actions.addListItem(tab, draft);
    if (result.ok) {
      setDraft('');
      setError(null);
    } else {
      setError(result.reason);
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Edit lists</h2>

      <div role="tablist" aria-label="Lists" className={styles.tabs}>
        {SLOT_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={styles.tab}
            onClick={() => selectTab(id)}
          >
            {slotLabel(id)}
          </button>
        ))}
      </div>

      {tab === 'company' && (
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={vm.companyEnabled}
            onChange={(event) => actions.setCompanyEnabled(event.target.checked)}
          />
          Roll a company name with the brief
        </label>
      )}

      <form className={styles.addForm} onSubmit={handleSubmit}>
        <label htmlFor={inputId} className={styles.visuallyHidden}>
          Add a {label}
        </label>
        <input
          id={inputId}
          // The user just opened the editor, so put the cursor where they'll type.
          autoFocus
          className={styles.input}
          value={draft}
          maxLength={MAX_ITEM_LENGTH}
          placeholder={`Add a ${label}…`}
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
        />
        <button type="submit" className={styles.key}>
          Add
        </button>
      </form>
      <p id={`${inputId}-error`} className={styles.error} aria-live="polite">
        {error}
      </p>

      {items.length === 0 ? (
        <p className={styles.muted}>This list is empty. Add a {label} to roll it.</p>
      ) : (
        <ul className={styles.itemList}>
          {items.map((item) => (
            <li key={item} className={styles.item}>
              <span>{item}</span>
              <button
                type="button"
                className={styles.removeKey}
                aria-label={`Remove ${item}`}
                onClick={() => actions.removeListItem(tab, item)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.panelActions}>
        <button type="button" className={styles.key} onClick={() => actions.resetList(tab)}>
          Reset {label}s
        </button>
        <button type="button" className={styles.key} onClick={actions.closePanel}>
          Back <kbd>Esc</kbd>
        </button>
      </div>
    </div>
  );
}
