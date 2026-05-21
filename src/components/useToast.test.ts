import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useToast } from './useToast';

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
      act(() => vi.advanceTimersByTime(2000));
      act(() => result.current.toast('second'));
      expect(result.current.message).toBe('second');
      act(() => vi.advanceTimersByTime(1000));
      expect(result.current.message).toBe('second');
      act(() => vi.advanceTimersByTime(2000));
      expect(result.current.message).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
