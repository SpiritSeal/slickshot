import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const toast = useCallback((msg: string) => {
    setMessage(msg);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMessage(null), 2400);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return { toast, message };
}

export function Toast({ message }: { message: string | null }) {
  return (
    <div
      className={`toast ${message ? 'toast--visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
