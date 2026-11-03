import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BriefRollerActions, BriefRollerViewModel } from '../../state/types';
import type { BriefSegment } from '../../core';
import { sliceBriefSegments } from '../../core';
import { useTypewriter } from '../shared/useTypewriter';
import styles from './cabin.module.css';

/** Font steps (see `.brief[data-size]`), largest first; the design size has no attribute. */
const SIZES = [undefined, 'medium', 'small', 'tiny'] as const;

/** Use the largest font step at which the whole brief fits inside the fixed-height card. */
function fitBrief(card: HTMLElement) {
  for (const size of SIZES) {
    if (size) card.dataset.size = size;
    else delete card.dataset.size;
    if (card.scrollHeight <= card.clientHeight) return;
  }
}

interface Props {
  vm: BriefRollerViewModel;
  actions: BriefRollerActions;
}

/** The brief sentence, each slot's words in that slot's colour. Clicking it copies the brief. */
export function BriefCard({ vm, actions }: Props) {
  const cardRef = useRef<HTMLButtonElement>(null);

  // While rolling, each slot settling changes vm.briefText/briefSegments in turn — hold the
  // typewriter's input steady until every slot is done, so typing starts once, not per-slot.
  const [settled, setSettled] = useState<{ text: string; segments: BriefSegment[] }>({
    text: vm.briefText,
    segments: vm.briefSegments,
  });
  useEffect(() => {
    if (!vm.isRolling) setSettled({ text: vm.briefText, segments: vm.briefSegments });
  }, [vm.isRolling, vm.briefText, vm.briefSegments]);

  const revealLength = useTypewriter(settled.text);
  const visibleSegments = sliceBriefSegments(settled.segments, revealLength);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    fitBrief(card);
    // Measure again once the web fonts are in; the fallback font has different widths.
    let active = true;
    void document.fonts?.ready.then(() => active && fitBrief(card));
    return () => {
      active = false;
    };
    // Re-measure on every reveal tick too: short, mid-type text always fits, but the
    // size must still be right once typing reaches the full sentence.
  }, [settled.text, revealLength]);

  return (
    <button
      ref={cardRef}
      type="button"
      className={styles.brief}
      data-rolling={vm.isRolling || undefined}
      disabled={!vm.canCopy}
      onClick={() => void actions.copyBrief()}
    >
      <span className={styles.briefText} aria-live="polite">
        {settled.segments.length === 0 ? (
          <span className={styles.briefPlaceholder}>Press Roll for a brief</span>
        ) : (
          visibleSegments.map((segment, index) =>
            segment.slot ? (
              <span key={index} data-slot={segment.slot}>
                {segment.text}
              </span>
            ) : (
              <Fragment key={index}>{segment.text}</Fragment>
            ),
          )
        )}
      </span>
      <span className={styles.copyHint} data-copied={vm.justCopied || undefined}>
        {vm.justCopied ? 'Copied!' : 'Click to copy · C'}
      </span>
    </button>
  );
}
