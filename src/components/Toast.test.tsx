import { describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { Toast, useToast } from './Toast';

describe('<Toast />', () => {
  it('is hidden when message is null', () => {
    render(<Toast message={null} />);
    const toast = screen.getByRole('status');
    expect(toast).not.toHaveClass('toast--visible');
    expect(toast).toHaveTextContent('');
  });

  it('shows the message and the visible class when set', () => {
    render(<Toast message="Saved" />);
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Saved');
    expect(toast).toHaveClass('toast--visible');
  });
});

describe('useToast', () => {
  it('sets a message and clears it after the timeout', async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useToast());
      act(() => result.current.toast('Hello'));
      expect(result.current.message).toBe('Hello');

      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(result.current.message).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('a new toast call resets the timer', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useToast());
      act(() => result.current.toast('first'));
      // Advance most of the way, but not past the timeout.
      act(() => vi.advanceTimersByTime(2000));
      act(() => result.current.toast('second'));
      expect(result.current.message).toBe('second');
      // Past where the original timer would have fired — second is still visible.
      act(() => vi.advanceTimersByTime(1000));
      expect(result.current.message).toBe('second');
      // Finally the second timer fires.
      act(() => vi.advanceTimersByTime(2000));
      expect(result.current.message).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
