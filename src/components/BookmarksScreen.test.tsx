import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookmarksScreen } from './BookmarksScreen';
import { listBookmarks, saveBookmark } from '../lib/bookmarks';

describe('<BookmarksScreen />', () => {
  it('shows the empty state and opens the editor', async () => {
    const user = userEvent.setup();
    render(<BookmarksScreen onBack={() => {}} toast={() => {}} />);

    expect(screen.getByText(/no bookmarks yet/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /add your first bookmark/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/new bookmark/i)).toBeInTheDocument();
  });

  it('persists a new bookmark, fires a toast, and renders it in the list', async () => {
    const user = userEvent.setup();
    const toast = vi.fn();
    render(<BookmarksScreen onBack={() => {}} toast={toast} />);

    await user.click(screen.getByRole('button', { name: /add bookmark/i }));
    await user.type(screen.getByLabelText(/label/i), 'Mom');
    await user.type(screen.getByLabelText(/caption/i), 'Daily pic');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Mom')).toBeInTheDocument();
    expect(screen.getByText(/daily pic/i)).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith('Bookmark added');
    expect(listBookmarks()).toHaveLength(1);
  });

  it('edits an existing bookmark', async () => {
    saveBookmark({ label: 'Friend', text: 'hi' });
    const user = userEvent.setup();
    const toast = vi.fn();
    render(<BookmarksScreen onBack={() => {}} toast={toast} />);

    await user.click(screen.getByRole('button', { name: 'Edit Friend' }));
    const input = screen.getByLabelText(/label/i);
    await user.clear(input);
    await user.type(input, 'Best Friend');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Best Friend')).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith('Bookmark updated');
    expect(listBookmarks()[0]?.label).toBe('Best Friend');
  });

  it('deletes a bookmark after confirmation', async () => {
    saveBookmark({ label: 'Doomed' });
    const user = userEvent.setup();
    const toast = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<BookmarksScreen onBack={() => {}} toast={toast} />);

    await user.click(screen.getByRole('button', { name: /delete doomed/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.queryByText('Doomed')).not.toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith('Bookmark deleted');
    expect(listBookmarks()).toEqual([]);
  });

  it('does not delete when the confirmation is cancelled', async () => {
    saveBookmark({ label: 'Keep me' });
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<BookmarksScreen onBack={() => {}} toast={() => {}} />);

    await user.click(screen.getByRole('button', { name: /delete keep me/i }));
    expect(screen.getByText('Keep me')).toBeInTheDocument();
    expect(listBookmarks()).toHaveLength(1);
  });

  it('invokes onBack when the back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<BookmarksScreen onBack={onBack} toast={() => {}} />);
    await user.click(screen.getByRole('button', { name: /^back$/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
