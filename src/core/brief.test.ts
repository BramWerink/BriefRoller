import { describe, expect, it } from 'vitest';
import { articleFor, buildBriefSegments, buildBriefSentence, formatHistoryLine } from './brief';

describe('formatHistoryLine', () => {
  it('keeps style casing and lowercases deliverable and client', () => {
    expect(
      formatHistoryLine({ style: 'Art Deco', deliverable: 'Tote bag', client: 'Fish shop' }),
    ).toBe('Art Deco tote bag · fish shop');
  });
});
import type { SlotsState, BriefListsState } from './types';

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
  };

  it('builds the sentence with correct articles and casing', () => {
    const slots: SlotsState = {
      style: { value: 'Coastal', locked: false },
      deliverable: { value: 'Sticker', locked: false },
      client: { value: 'Fish shop', locked: false },
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
    };
    expect(buildBriefSentence(lists, slots)).toBe('');
  });
});

describe('buildBriefSegments', () => {
  const lists: BriefListsState = {
    style: ['Art Deco'],
    deliverable: ['Poster'],
    client: ['Ice cream van'],
  };

  it('tags each slot word with its slot, matching the sentence casing', () => {
    const slots: SlotsState = {
      style: { value: 'Art Deco', locked: false },
      deliverable: { value: 'Poster', locked: false },
      client: { value: 'Ice cream van', locked: false },
    };
    expect(buildBriefSegments(lists, slots)).toEqual([
      { text: 'Design a ' },
      { text: 'poster', slot: 'deliverable' },
      { text: ' in ' },
      { text: 'Art Deco', slot: 'style' },
      { text: ' style for an ' },
      { text: 'ice cream van', slot: 'client' },
    ]);
  });

  it('returns a single untagged prompt when a list is empty', () => {
    const slots: SlotsState = {
      style: { value: null, locked: false },
      deliverable: { value: null, locked: false },
      client: { value: null, locked: false },
    };
    expect(buildBriefSegments({ ...lists, deliverable: [] }, slots)).toEqual([
      { text: 'Add a deliverable first' },
    ]);
    expect(buildBriefSegments(lists, slots)).toEqual([]);
  });
});
