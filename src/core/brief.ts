import type { BriefListsState, EnabledSlots, SlotId, SlotsState } from './types';
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

/** Style and Client on, Company off — the shape most callers and tests want by default. */
const DEFAULT_ENABLED_SLOTS: EnabledSlots = {
  style: true,
  deliverable: true,
  client: true,
  company: false,
};

/**
 * The brief split into pieces, so a skin can style each slot's words. Deliverable always
 * appears; Style, Client and Company drop out of the sentence when switched off. With both
 * a client and a company, the company is named first, e.g. "...for Saltmarsh & Co., a fish shop".
 */
export function buildBriefSegments(
  lists: BriefListsState,
  slots: SlotsState,
  enabledSlots: EnabledSlots = DEFAULT_ENABLED_SLOTS,
): BriefSegment[] {
  const active = activeSlotIds(enabledSlots);
  const emptySlot = active.find((id) => lists[id].length === 0);
  if (emptySlot) {
    return [{ text: `Add a ${emptySlot} first` }];
  }

  const deliverable = slots.deliverable.value;
  const style = enabledSlots.style ? slots.style.value : null;
  const client = enabledSlots.client ? slots.client.value : null;
  const company = enabledSlots.company ? slots.company.value : null;
  if (
    !deliverable ||
    (enabledSlots.style && !style) ||
    (enabledSlots.client && !client) ||
    (enabledSlots.company && !company)
  ) {
    return [];
  }

  const deliverableLower = deliverable.toLowerCase();

  const segments: BriefSegment[] = [
    { text: `Design ${articleFor(deliverableLower)} ` },
    { text: deliverableLower, slot: 'deliverable' },
  ];

  if (style) {
    segments.push({ text: ' in ' }, { text: style, slot: 'style' }, { text: ' style' });
  }

  if (company || client) {
    segments.push({ text: ' for ' });
    if (company) {
      segments.push({ text: company, slot: 'company' });
    }
    if (client) {
      const clientLower = client.toLowerCase();
      segments.push(
        { text: `${company ? ', ' : ''}${articleFor(clientLower)} ` },
        { text: clientLower, slot: 'client' },
      );
    }
  }

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
  enabledSlots: EnabledSlots = DEFAULT_ENABLED_SLOTS,
): string {
  return buildBriefSegments(lists, slots, enabledSlots)
    .map((segment) => segment.text)
    .join('');
}

/** Short history line, e.g. "Coastal sticker · Saltmarsh & Co. · fish shop". */
export function formatHistoryLine(values: Partial<Record<SlotId, string>>): string {
  const styleDeliverable = [values.style, values.deliverable?.toLowerCase()]
    .filter(Boolean)
    .join(' ');
  return [styleDeliverable, values.company, values.client?.toLowerCase()]
    .filter(Boolean)
    .join(' · ');
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
