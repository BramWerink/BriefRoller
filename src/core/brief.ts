import type { BriefListsState, SlotId, SlotsState } from './types';
import { activeSlotIds } from './types';

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

/**
 * The brief split into pieces, so a skin can style each slot's words. With a company name,
 * it's named ahead of the client, e.g. "...for Saltmarsh & Co., a fish shop".
 */
export function buildBriefSegments(
  lists: BriefListsState,
  slots: SlotsState,
  companyEnabled = false,
): BriefSegment[] {
  const active = activeSlotIds(companyEnabled);
  const emptySlot = active.find((id) => lists[id].length === 0);
  if (emptySlot) {
    return [{ text: `Add a ${emptySlot} first` }];
  }

  const style = slots.style.value;
  const deliverable = slots.deliverable.value;
  const client = slots.client.value;
  const company = companyEnabled ? slots.company.value : null;
  if (!style || !deliverable || !client || (companyEnabled && !company)) {
    return [];
  }

  const deliverableLower = deliverable.toLowerCase();
  const clientLower = client.toLowerCase();

  const segments: BriefSegment[] = [
    { text: `Design ${articleFor(deliverableLower)} ` },
    { text: deliverableLower, slot: 'deliverable' },
    { text: ' in ' },
    { text: style, slot: 'style' },
    { text: ' style for ' },
  ];

  if (company) {
    segments.push({ text: company, slot: 'company' }, { text: `, ${articleFor(clientLower)} ` });
  } else {
    segments.push({ text: articleFor(clientLower) + ' ' });
  }
  segments.push({ text: clientLower, slot: 'client' });

  return segments;
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

export function buildBriefSentence(
  lists: BriefListsState,
  slots: SlotsState,
  companyEnabled = false,
): string {
  return buildBriefSegments(lists, slots, companyEnabled)
    .map((segment) => segment.text)
    .join('');
}

/** Short history line, e.g. "Coastal sticker · Saltmarsh & Co. · fish shop". */
export function formatHistoryLine(values: Partial<Record<SlotId, string>>): string {
  const company = values.company ? ` · ${values.company}` : '';
  return `${values.style} ${values.deliverable?.toLowerCase()}${company} · ${values.client?.toLowerCase()}`;
}

export function slotLabel(id: SlotId): string {
  switch (id) {
    case 'style':
      return 'Style';
    case 'deliverable':
      return 'Deliverable';
    case 'client':
      return 'Client';
    case 'company':
      return 'Company';
  }
}
