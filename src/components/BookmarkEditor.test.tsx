import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookmarkEditor } from './BookmarkEditor';
import type { Bookmark } from '../types';

describe('<BookmarkEditor />', () => {
  it('disables submit until a label is entered and trims whitespace (Web Share kind)', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<BookmarkEditor onSave={onSave} onCancel={onCancel} />);

    const save = screen.getByRole('button', { name: /^save$/i });
    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText(/label/i), '  Mom  ');
    expect(save).toBeEnabled();

    await user.type(screen.getByLabelText(/^title/i), 'Hello');
    await user.type(screen.getByLabelText(/caption/i), 'Pic of the day');
    await user.click(save);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      id: undefined,
      label: 'Mom',
      route: {
        kind: 'web-share',
        title: 'Hello',
        text: 'Pic of the day',
      },
    });
  });

  it('pre-fills fields when editing a Web Share bookmark and passes the id back on save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const initial: Bookmark = {
      id: 'bm-1',
      label: 'Friend',
      route: { kind: 'web-share', title: 't', text: 'c' },
    };
    render(
      <BookmarkEditor initial={initial} onSave={onSave} onCancel={() => {}} />,
    );

    expect(screen.getByLabelText(/label/i)).toHaveValue('Friend');
    expect(screen.getByLabelText(/^title/i)).toHaveValue('t');
    expect(screen.getByLabelText(/caption/i)).toHaveValue('c');

    await user.clear(screen.getByLabelText(/^title/i));
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith({
      id: 'bm-1',
      label: 'Friend',
      route: { kind: 'web-share', title: undefined, text: 'c' },
    });
  });

  it('switches to Apple Shortcut route and saves the shortcut name', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<BookmarkEditor onSave={onSave} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/label/i), 'Mom');
    await user.click(screen.getByRole('button', { name: /apple shortcut/i }));

    const save = screen.getByRole('button', { name: /^save$/i });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText(/shortcut name/i), 'Send to Mom');
    expect(save).toBeEnabled();

    await user.click(save);
    expect(onSave).toHaveBeenCalledWith({
      id: undefined,
      label: 'Mom',
      route: {
        kind: 'apple-shortcut',
        shortcutName: 'Send to Mom',
        passImageVia: 'clipboard',
      },
    });
  });

  it('builds a URL scheme route from the WhatsApp preset', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<BookmarkEditor onSave={onSave} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/label/i), 'Group');
    await user.click(screen.getByRole('button', { name: /url scheme/i }));
    await user.click(screen.getByRole('button', { name: 'WhatsApp' }));
    await user.type(screen.getByLabelText(/recipient/i), '15551234567');
    await user.type(screen.getByLabelText(/^text/i), 'hello');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith({
      id: undefined,
      label: 'Group',
      route: {
        kind: 'url-scheme',
        template: 'https://wa.me/{recipient}?text={text}',
        recipient: '15551234567',
        text: 'hello',
        passImageVia: 'clipboard',
      },
    });
  });

  it('invokes onCancel when the Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<BookmarkEditor onSave={() => {}} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
