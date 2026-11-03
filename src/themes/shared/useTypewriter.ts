import { useEffect, useState } from 'react';

const TYPE_INTERVAL_MS = 18;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Characters of `text` revealed so far; restarts from 0 each time `text` changes. The
 * dependency array alone gates the restart — a manual "seen this text already" ref guard
 * used to sit here too, but it made the effect a no-op on its second, StrictMode-only dev
 * invocation (the ref survives that replay, so the guard saw its own value and skipped
 * setting up the interval), leaving the reveal stuck at 0 on first mount.
 */
export function useTypewriter(text: string, intervalMs = TYPE_INTERVAL_MS): number {
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion() || text.length === 0) {
      setLength(text.length);
      return;
    }

    setLength(0);
    let current = 0;
    const id = window.setInterval(() => {
      current += 1;
      setLength(current);
      if (current >= text.length) window.clearInterval(id);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [text, intervalMs]);

  return length;
}
