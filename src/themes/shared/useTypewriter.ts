import { useEffect, useRef, useState } from 'react';

const TYPE_INTERVAL_MS = 18;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Characters of `text` revealed so far; restarts from 0 each time `text` changes. */
export function useTypewriter(text: string, intervalMs = TYPE_INTERVAL_MS): number {
  const [length, setLength] = useState(text.length);
  const prevText = useRef<string | null>(null);

  useEffect(() => {
    if (prevText.current === text) return;
    prevText.current = text;

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
