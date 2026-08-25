"use client";

import { useEffect, useRef, useState } from "react";

// Counter rolls up digit by digit on change; `aria-live="polite"` so screen-reader
// users get the number as text (docs/02-design-system.md §5).
export function PointsCounter({ value, label = "pts" }: { value: number; label?: string }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;
    const to = value;
    if (reduced || from === to) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }
    const t0 = performance.now();
    const dur = 320;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(from + (to - from) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className="pointspill" aria-live="polite">
      <strong className="tnum">{display}</strong> {label}
    </span>
  );
}
