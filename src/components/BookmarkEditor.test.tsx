import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookmarkEditor } from './BookmarkEditor';

describe('<BookmarkEditor />', () => {
  it('disables submit until a label is entered and trims whitespace', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<BookmarkEditor onSave={onSave} onCancel={onCancel} />);

    const save = screen.getByRole('button', { name: /save/i });
    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText(/label/i), '  Mom  ');
    expect(save).toBeEnabled();

    await user.type(screen.getByLabelText(/title/i), 'Hello');
    await user.type(screen.getByLabelText(/caption/i), 'Pic of the day');
    await user.click(save);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      id: undefined,
      label: 'Mom',
      title: 'Hello',
      text: 'Pic of the day',
    });
  });

  it('pre-fills fields when editing and passes the id back on save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <BookmarkEditor
        initial={{ id: 'bm-1', label: 'Friend', title: 't', text: 'c' }}
        onSave={onSave}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByLabelText(/label/i)).toHaveValue('Friend');
    expect(screen.getByLabelText(/title/i)).toHaveValue('t');
    expect(screen.getByLabelText(/caption/i)).toHaveValue('c');

    await user.clear(screen.getByLabelText(/title/i));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith({
      id: 'bm-1',
      label: 'Friend',
      title: undefined,
      text: 'c',
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
