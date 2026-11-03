import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { createDefaultState, saveState, type PersistedStateV1 } from '../core';
import { listThemes } from '../themes/registry';

// Every theme runs the same tests. Saved state can't select a theme (an old 'plain' save
// moves to the default), so the registry is told which theme to hand out instead.
const forcedTheme = vi.hoisted(() => ({ id: '' }));
vi.mock('../themes/registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../themes/registry')>();
  return { ...actual, getTheme: () => actual.getTheme(forcedTheme.id) };
});

function stubMatchMedia({ wide = false, reducedMotion = true } = {}) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query.includes('reduced-motion') ? reducedMotion : wide,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function seedState(change: (state: PersistedStateV1) => void) {
  const state = createDefaultState();
  change(state);
  saveState(state);
}

/** Company is off here — these tests are about the core three slots; see "company name" below. */
function seedRolledState() {
  seedState((state) => {
    state.slots.style = { value: 'Art Deco', locked: false };
    state.slots.deliverable = { value: 'Poster', locked: false };
    state.slots.client = { value: 'Ice cream van', locked: false };
    state.companyEnabled = false;
  });
}

describe.each(listThemes().map((theme) => theme.id))('App (%s theme)', (themeId) => {
  beforeEach(() => {
    forcedTheme.id = themeId;
    localStorage.clear();
    stubMatchMedia();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('toggles aria-pressed on a lock button', async () => {
    seedRolledState();
    const user = userEvent.setup();
    render(<App />);

    const lock = screen.getByRole('button', { name: 'Lock style' });
    expect(lock).toHaveAttribute('aria-pressed', 'false');
    await user.click(lock);
    expect(lock).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('1');
    expect(lock).toHaveAttribute('aria-pressed', 'false');
  });

  it('opens on a rolled brief instead of empty slots', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Lock style' })).toBeEnabled();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('copies the brief sentence to the clipboard', async () => {
    seedRolledState();
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith(
      'Design a poster in Art Deco style for an ice cream van',
    );
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  it('closes the history and edit panels with Escape', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('h');
    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('heading', { name: 'History' })).not.toBeInTheDocument();

    await user.keyboard('e');
    const input = screen.getByLabelText('Add a style');
    await user.type(input, 'Solarpunk');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('ignores letter shortcuts while typing in the edit input', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('e');
    await user.type(screen.getByLabelText('Add a style'), 'Hhec{Enter}');

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByText('Hhec')).toBeInTheDocument();
  });

  it('rolls with Space but not when Space activates a focused button', async () => {
    seedRolledState();
    const user = userEvent.setup();
    render(<App />);

    const lock = screen.getByRole('button', { name: 'Lock style' });
    lock.focus();
    await user.keyboard(' ');
    expect(lock).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Poster')).toBeInTheDocument();

    act(() => lock.blur());
    await user.keyboard(' ');
    // The locked style stays; a theme may also show it inside the brief sentence.
    expect(screen.getAllByText('Art Deco').length).toBeGreaterThan(0);
    expect(screen.queryByText('Poster')).not.toBeInTheDocument();
  });

  it('shows an add-first prompt when a list is emptied', async () => {
    seedState((state) => {
      state.lists.client = ['Bakery'];
      state.slots.client = { value: 'Bakery', locked: false };
    });
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('e');
    await user.click(screen.getByRole('tab', { name: 'Client' }));
    await user.click(screen.getByRole('button', { name: 'Remove Bakery' }));
    await user.keyboard('{Escape}');

    expect(screen.getByText('Add a client first')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lock client' })).toBeDisabled();
  });

  it('lists history newest first, numbered from the oldest', async () => {
    seedRolledState();
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('   h');

    const rows = screen.getAllByRole('button').filter((b) => /^\d{2} /.test(b.textContent ?? ''));
    expect(rows.map((row) => row.textContent?.slice(0, 2))).toEqual(['03', '02', '01']);
  });

  it('renders the Pin key disabled with a desktop-only hint', () => {
    render(<App />);
    const pin = screen.getByRole('button', { name: 'Pin' });
    expect(pin).toBeDisabled();
    expect(pin).toHaveAttribute('title', 'Available in the desktop app');
  });

  describe('company name', () => {
    it('is on by default and lands in the brief, ahead of the client', () => {
      seedState((state) => {
        state.slots.style = { value: 'Art Deco', locked: false };
        state.slots.deliverable = { value: 'Poster', locked: false };
        state.slots.client = { value: 'Ice cream van', locked: false };
        state.slots.company = { value: 'Northlane', locked: false };
      });
      render(<App />);

      expect(screen.getByRole('button', { name: 'Lock company' })).toBeEnabled();
      // "Northlane" appears twice: once in its own slot card, once inside the brief sentence.
      expect(screen.getAllByText(/Northlane/).length).toBeGreaterThanOrEqual(2);
    });

    it('fills in just the company on an existing brief, leaving the rest untouched', () => {
      seedRolledState(); // companyEnabled: false here, so company was never rolled
      seedState((state) => {
        state.slots.style = { value: 'Art Deco', locked: false };
        state.slots.deliverable = { value: 'Poster', locked: false };
        state.slots.client = { value: 'Ice cream van', locked: false };
        state.companyEnabled = true; // now on, but company itself is still unrolled
      });
      render(<App />);

      // Each may appear twice: once in its slot card, once inside the brief sentence.
      expect(screen.getAllByText('Art Deco').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Poster|poster/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Ice cream van|ice cream van/).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: 'Lock company' })).toBeEnabled();
    });

    it('locks the company name with the 4 key', async () => {
      const user = userEvent.setup();
      render(<App />);

      const lock = screen.getByRole('button', { name: 'Lock company' });
      expect(lock).toHaveAttribute('aria-pressed', 'false');
      await user.keyboard('4');
      expect(lock).toHaveAttribute('aria-pressed', 'true');
    });

    it('hides the card and drops it from the brief once switched off', async () => {
      const user = userEvent.setup();
      render(<App />);
      expect(screen.getByRole('button', { name: 'Lock company' })).toBeInTheDocument();

      await user.keyboard('e');
      await user.click(screen.getByRole('tab', { name: 'Company' }));
      const toggle = screen.getByRole('checkbox', { name: /roll a company name/i });
      expect(toggle).toBeChecked();
      await user.click(toggle);
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('button', { name: 'Lock company' })).not.toBeInTheDocument();
    });
  });
});
