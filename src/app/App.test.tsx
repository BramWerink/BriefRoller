import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { createDefaultState, saveState } from '../core';

function stubMatchMedia({ wide = false, reducedMotion = true } = {}) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query.includes('reduced-motion') ? reducedMotion : wide,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function seedRolledState() {
  const state = createDefaultState();
  state.slots.style = { value: 'Art Deco', locked: false };
  state.slots.deliverable = { value: 'Poster', locked: false };
  state.slots.client = { value: 'Ice cream van', locked: false };
  saveState(state);
}

describe('App (plain theme)', () => {
  beforeEach(() => {
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

  it('disables locks while the slot is empty', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Lock style' })).toBeDisabled();
  });

  it('copies the brief sentence to the clipboard', async () => {
    seedRolledState();
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith('Design an Art Deco poster for an ice cream van');
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
    expect(screen.getByText('Art Deco')).toBeInTheDocument();
    expect(screen.queryByText('Poster')).not.toBeInTheDocument();
  });

  it('shows an add-first prompt when a list is emptied', async () => {
    const state = createDefaultState();
    state.lists.client = ['Bakery'];
    state.slots.client = { value: 'Bakery', locked: false };
    saveState(state);
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
});
