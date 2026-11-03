import { describe, expect, it } from 'vitest';
import { articleFor, buildBriefSegments, buildBriefSentence, formatHistoryLine } from './brief';
import type { SlotsState, BriefListsState } from './types';

describe('formatHistoryLine', () => {
  it('keeps style casing and lowercases deliverable and client', () => {
    expect(
      formatHistoryLine({ style: 'Art Deco', deliverable: 'Tote bag', client: 'Fish shop' }),
    ).toBe('Art Deco tote bag · fish shop');
  });

  it('inserts the company name, unchanged, between deliverable and client', () => {
    expect(
      formatHistoryLine({
        style: 'Art Deco',
        deliverable: 'Tote bag',
        client: 'Fish shop',
        company: 'Northlane',
      }),
    ).toBe('Art Deco tote bag · Northlane · fish shop');
  });
});

describe('articleFor', () => {
  it('uses "an" before a vowel-initial word', () => {
    expect(articleFor('Art Deco')).toBe('an');
    expect(articleFor('Ice cream van')).toBe('an');
    expect(articleFor('Enamel pin')).toBe('an');
  });

  it('uses "a" before a consonant-initial word', () => {
    expect(articleFor('Coastal')).toBe('a');
    expect(articleFor('Y2K')).toBe('a');
  });
});

describe('buildBriefSentence', () => {
  const lists: BriefListsState = {
    style: ['Coastal'],
    deliverable: ['Sticker'],
    client: ['Fish shop'],
    company: ['Northlane'],
  };

  it('builds the sentence with correct articles and casing', () => {
    const slots: SlotsState = {
      style: { value: 'Coastal', locked: false },
      deliverable: { value: 'Sticker', locked: false },
      client: { value: 'Fish shop', locked: false },
      company: { value: null, locked: false },
    };
    expect(buildBriefSentence(lists, slots)).toBe(
      'Design a sticker in Coastal style for a fish shop',
    );
  });

  it('uses "an" when deliverable or client is vowel-initial', () => {
    const slots: SlotsState = {
      style: { value: 'Art Deco', locked: false },
      deliverable: { value: 'Enamel pin', locked: false },
      client: { value: 'Ice cream van', locked: false },
      company: { value: null, locked: false },
    };
    expect(buildBriefSentence(lists, slots)).toBe(
      'Design an enamel pin in Art Deco style for an ice cream van',
    );
  });

  it('prompts to add an item when a list is empty, in style/deliverable/client order', () => {
    const slots: SlotsState = {
      style: { value: null, locked: false },
      deliverable: { value: 'Sticker', locked: false },
      client: { value: 'Fish shop', locked: false },
      company: { value: null, locked: false },
    };
    const emptyStyleLists: BriefListsState = { ...lists, style: [] };
    expect(buildBriefSentence(emptyStyleLists, slots)).toBe('Add a style first');

    const emptyClientLists: BriefListsState = { ...lists, client: [] };
    expect(buildBriefSentence(emptyClientLists, slots)).toBe('Add a client first');
  });

  it('returns an empty string when a slot has not been rolled yet', () => {
    const slots: SlotsState = {
      style: { value: null, locked: false },
      deliverable: { value: null, locked: false },
      client: { value: null, locked: false },
      company: { value: null, locked: false },
    };
    expect(buildBriefSentence(lists, slots)).toBe('');
  });

  it('ignores the company slot when disabled, even with an empty company list', () => {
    const slots: SlotsState = {
      style: { value: 'Coastal', locked: false },
      deliverable: { value: 'Sticker', locked: false },
      client: { value: 'Fish shop', locked: false },
      company: { value: null, locked: false },
    };
    expect(buildBriefSentence({ ...lists, company: [] }, slots, false)).toBe(
      'Design a sticker in Coastal style for a fish shop',
    );
  });

  it('names the company ahead of the client when enabled', () => {
    const slots: SlotsState = {
      style: { value: 'Coastal', locked: false },
      deliverable: { value: 'Sticker', locked: false },
      client: { value: 'Fish shop', locked: false },
      company: { value: 'Northlane', locked: false },
    };
    expect(buildBriefSentence(lists, slots, true)).toBe(
      'Design a sticker in Coastal style for Northlane, a fish shop',
    );
  });

  it('is blank while enabled but the company has not rolled yet', () => {
    const slots: SlotsState = {
      style: { value: 'Coastal', locked: false },
      deliverable: { value: 'Sticker', locked: false },
      client: { value: 'Fish shop', locked: false },
      company: { value: null, locked: false },
    };
    expect(buildBriefSentence(lists, slots, true)).toBe('');
  });

  it('prompts to add a company first when enabled and its list is empty', () => {
    const slots: SlotsState = {
      style: { value: 'Coastal', locked: false },
      deliverable: { value: 'Sticker', locked: false },
      client: { value: 'Fish shop', locked: false },
      company: { value: null, locked: false },
    };
    expect(buildBriefSentence({ ...lists, company: [] }, slots, true)).toBe('Add a company first');
  });
});

describe('buildBriefSegments', () => {
  const lists: BriefListsState = {
    style: ['Art Deco'],
    deliverable: ['Poster'],
    client: ['Ice cream van'],
    company: ['Northlane'],
  };

  it('tags each slot word with its slot, matching the sentence casing', () => {
    const slots: SlotsState = {
      style: { value: 'Art Deco', locked: false },
      deliverable: { value: 'Poster', locked: false },
      client: { value: 'Ice cream van', locked: false },
      company: { value: null, locked: false },
    };
    expect(buildBriefSegments(lists, slots)).toEqual([
      { text: 'Design a ' },
      { text: 'poster', slot: 'deliverable' },
      { text: ' in ' },
      { text: 'Art Deco', slot: 'style' },
      { text: ' style for ' },
      { text: 'an ' },
      { text: 'ice cream van', slot: 'client' },
    ]);
  });

  it('returns a single untagged prompt when a list is empty', () => {
    const slots: SlotsState = {
      style: { value: null, locked: false },
      deliverable: { value: null, locked: false },
      client: { value: null, locked: false },
      company: { value: null, locked: false },
    };
    expect(buildBriefSegments({ ...lists, deliverable: [] }, slots)).toEqual([
      { text: 'Add a deliverable first' },
    ]);
    expect(buildBriefSegments(lists, slots)).toEqual([]);
  });

  it('tags the company name and keeps it ahead of the client', () => {
    const slots: SlotsState = {
      style: { value: 'Art Deco', locked: false },
      deliverable: { value: 'Poster', locked: false },
      client: { value: 'Ice cream van', locked: false },
      company: { value: 'Northlane', locked: false },
    };
    expect(buildBriefSegments(lists, slots, true)).toEqual([
      { text: 'Design a ' },
      { text: 'poster', slot: 'deliverable' },
      { text: ' in ' },
      { text: 'Art Deco', slot: 'style' },
      { text: ' style for ' },
      { text: 'Northlane', slot: 'company' },
      { text: ', an ' },
      { text: 'ice cream van', slot: 'client' },
    ]);
  });
});
