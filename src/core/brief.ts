import type { BriefListsState, SlotId, SlotsState } from './types';
import { SLOT_IDS } from './types';

const VOWEL_RE = /^[aeiou]/i;

/** "a" or "an", based on the word's first letter. */
export function articleFor(word: string): 'a' | 'an' {
  return VOWEL_RE.test(word.trim()) ? 'an' : 'a';
}

export function buildBriefSentence(lists: BriefListsState, slots: SlotsState): string {
  const emptySlot = SLOT_IDS.find((id) => lists[id].length === 0);
  if (emptySlot) {
    return `Add a ${emptySlot} first`;
  }

  const style = slots.style.value;
  const deliverable = slots.deliverable.value;
  const client = slots.client.value;
  if (!style || !deliverable || !client) {
    return '';
  }

  const deliverableLower = deliverable.toLowerCase();
  const clientLower = client.toLowerCase();

  return `Design ${articleFor(style)} ${style} ${deliverableLower} for ${articleFor(clientLower)} ${clientLower}`;
}

/** Short history line, e.g. "Coastal sticker · fish shop". */
export function formatHistoryLine(values: Record<SlotId, string>): string {
  return `${values.style} ${values.deliverable.toLowerCase()} · ${values.client.toLowerCase()}`;
}

export function slotLabel(id: SlotId): string {
  switch (id) {
    case 'style':
      return 'Style';
    case 'deliverable':
      return 'Deliverable';
    case 'client':
      return 'Client';
  }
}
