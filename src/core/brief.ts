import type { BriefListsState, SlotId, SlotsState } from './types';
import { SLOT_IDS } from './types';

const VOWEL_RE = /^[aeiou]/i;

/** "a" or "an", based on the word's first letter. */
export function articleFor(word: string): 'a' | 'an' {
  return VOWEL_RE.test(word.trim()) ? 'an' : 'a';
}

/** A piece of the brief sentence; `slot` marks the words that came from that slot. */
export interface BriefSegment {
  text: string;
  slot?: SlotId;
}

/** The brief split into pieces, so a skin can style each slot's words. */
export function buildBriefSegments(lists: BriefListsState, slots: SlotsState): BriefSegment[] {
  const emptySlot = SLOT_IDS.find((id) => lists[id].length === 0);
  if (emptySlot) {
    return [{ text: `Add a ${emptySlot} first` }];
  }

  const style = slots.style.value;
  const deliverable = slots.deliverable.value;
  const client = slots.client.value;
  if (!style || !deliverable || !client) {
    return [];
  }

  const deliverableLower = deliverable.toLowerCase();
  const clientLower = client.toLowerCase();

  return [
    { text: `Design ${articleFor(deliverableLower)} ` },
    { text: deliverableLower, slot: 'deliverable' },
    { text: ' in ' },
    { text: style, slot: 'style' },
    { text: ` style for ${articleFor(clientLower)} ` },
    { text: clientLower, slot: 'client' },
  ];
}

/** The leading `maxLength` characters of `segments`, trimming the segment that straddles the cut. */
export function sliceBriefSegments(segments: BriefSegment[], maxLength: number): BriefSegment[] {
  const result: BriefSegment[] = [];
  let used = 0;
  for (const segment of segments) {
    if (used >= maxLength) break;
    const remaining = maxLength - used;
    if (segment.text.length <= remaining) {
      result.push(segment);
      used += segment.text.length;
    } else {
      result.push({ ...segment, text: segment.text.slice(0, remaining) });
      used = maxLength;
    }
  }
  return result;
}

export function buildBriefSentence(lists: BriefListsState, slots: SlotsState): string {
  return buildBriefSegments(lists, slots)
    .map((segment) => segment.text)
    .join('');
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
