"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const WEEKS_PER_MONTH = 4.345;

function clampPct(v: number) {
  return Math.max(3, Math.min(97, v));
}

// Ported from prototype's layoutRailLabels(): "Your date" is pinned to its tick and
// the end label rides the marker, so they can collide. Lay out in px and stack the
// lower-priority one onto a second row rather than letting glyphs merge.
function layoutRailLabels(
  trailEl: HTMLDivElement,
  todayEl: HTMLSpanElement,
  idealEl: HTMLSpanElement,
  markEl: HTMLSpanElement,
  markerLeftPct: number,
  idealLeftPct: number
) {
  const w = trailEl.clientWidth;
  if (!w) return;
  const place = (el: HTMLElement, pct: number): [number, number] => {
    el.style.transform = "none";
    el.style.right = "auto";
    const bw = el.offsetWidth;
    const x = Math.max(0, Math.min(w - bw, (pct / 100) * w - bw / 2));
    el.style.left = x + "px";
    return [x, bw];
  };
  const [mx, mw] = place(markEl, markerLeftPct);
  const [ix, iw] = place(idealEl, idealLeftPct);
  todayEl.style.left = "0px";
  const tw = todayEl.offsetWidth;
  const hits = (a: number, aw: number, b: number, bw: number) => a < b + bw + 8 && b < a + aw + 8;
  todayEl.classList.toggle("stack", hits(0, tw, mx, mw));
  idealEl.classList.toggle("stack", hits(ix, iw, mx, mw) || hits(ix, iw, 0, tw));
}

export function TimelineRail({
  weeks,
  idealWeeks,
  baseWeeks,
  isDragging = false,
}: {
  weeks: number;
  idealWeeks: number;
  baseWeeks: number | null;
  isDragging?: boolean;
}) {
  const trailRef = useRef<HTMLDivElement>(null);
  const ticksRef = useRef<SVGSVGElement>(null);
  const todayRef = useRef<HTMLSpanElement>(null);
  const idealRef = useRef<HTMLSpanElement>(null);
  const horizonRef = useRef<HTMLSpanElement>(null);

  const [ticksW, setTicksW] = useState(346);
  const [sweepKey, setSweepKey] = useState(0);
  const prevWeeksRef = useRef<number | null>(null);
  const onTrack = weeks <= idealWeeks;

  const horizon = Math.max(baseWeeks ?? weeks, idealWeeks) * 1.12 || 1;
  const markerPct = clampPct((weeks / horizon) * 100);
  const idealPct = clampPct((idealWeeks / horizon) * 100);

  useEffect(() => {
    const el = ticksRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTicksW(el.clientWidth || 346));
    ro.observe(el);
    setTicksW(el.clientWidth || 346);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (trailRef.current && todayRef.current && idealRef.current && horizonRef.current) {
      layoutRailLabels(trailRef.current, todayRef.current, idealRef.current, horizonRef.current, markerPct, idealPct);
    }
  }, [markerPct, idealPct, ticksW]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prevWeeksRef.current !== null && weeks < prevWeeksRef.current && !reduced) {
      setSweepKey((k) => k + 1);
    }
    prevWeeksRef.current = weeks;
  }, [weeks]);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeks * 7);
  const horizonLabel = targetDate.toLocaleString("en-GB", { month: "short", year: "numeric" });

  const months = Math.ceil(horizon / WEEKS_PER_MONTH);
  const tickLines = [];
  for (let m = 1; m <= months; m++) {
    const x = ((m * WEEKS_PER_MONTH) / horizon) * ticksW;
    if (x > ticksW - 2) break;
    const major = m % 3 === 0;
    tickLines.push(
      <line
        key={m}
        x1={x}
        y1={major ? 8 : 11}
        x2={x}
        y2={18}
        stroke="var(--rail)"
        strokeWidth={major ? 1.5 : 1}
        strokeLinecap="round"
      />
    );
  }

  return (
    <div className={`trail${isDragging ? " is-dragging" : ""}${!onTrack ? " is-slip" : ""}`} ref={trailRef}>
      <svg className="ticks" ref={ticksRef} aria-hidden="true">
        {tickLines}
      </svg>
      <div className="track">
        <i key={sweepKey} className={`sweep${sweepKey > 0 ? " go" : ""}`} />
      </div>
      <div className="ideal" style={{ left: idealPct + "%" }} />
      <div className="marker" style={{ left: markerPct + "%" }} />
      <span className="lbl" ref={todayRef}>
        Today
      </span>
      <span className="lbl i" ref={idealRef} style={{ left: idealPct + "%" }}>
        Your date
      </span>
      <span className="lbl r" ref={horizonRef}>
        {horizonLabel}
      </span>
    </div>
  );
}
