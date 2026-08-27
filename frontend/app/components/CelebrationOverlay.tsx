"use client";

import { useEffect, useRef } from "react";

interface Shard {
  x: number;
  y: number;
  vy: number;
  rot: number;
  vr: number;
  s: number;
}

// Design board 11. The one moment in the product that earns confetti — a goal
// finished, never a habit ticked. The stage is dark in BOTH themes (--cel-bg),
// because a light overlay drops the lime figure to ~1.4:1.
export function CelebrationOverlay({
  open,
  goalName,
  targetAmount,
  awarded,
  capped,
  message,
  weeksEarly,
  partnerName,
  pointsPerGBP,
  onSeeRewards,
  onBack,
}: {
  open: boolean;
  goalName: string;
  targetAmount: string;
  awarded: number;
  capped: boolean;
  message: string;
  weeksEarly: number;
  partnerName: string;
  pointsPerGBP: number;
  onSeeRewards: () => void;
  onBack: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open) return;
    document.getElementById("celNext")?.focus();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || capped) return;

    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = (c.width = c.offsetWidth);
    const h = (c.height = c.offsetHeight);
    const bits: Shard[] = Array.from({ length: 14 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.7,
      y: -20 - Math.random() * 120,
      vy: 1.6 + Math.random() * 1.8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.16,
      s: 5 + Math.random() * 7,
    }));
    const t0 = performance.now();
    let raf = 0;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--lime").trim();
      bits.forEach((b) => {
        b.y += b.vy;
        b.rot += b.vr;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
        ctx.restore();
      });
      if (t - t0 < 1600) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [open, capped]);

  const cash = (awarded / pointsPerGBP).toFixed(2);
  const headline =
    weeksEarly > 0 ? `You got there\n${weeksEarly} week${weeksEarly === 1 ? "" : "s"} early` : "You got there";

  return (
    <div
      className="celebrate"
      data-open={open ? "true" : "false"}
      role="dialog"
      aria-modal="true"
      aria-labelledby="celTitle"
    >
      {!capped && <div className="bloom" />}
      <canvas ref={canvasRef} />

      <span className="eyebrow cel-line">
        Goal reached · {goalName} {targetAmount}
      </span>
      <h2 className="num cel-head" id="celTitle">
        {headline}
      </h2>
      <span
        className="num cel-points"
        aria-live="polite"
        style={{ color: capped ? "var(--muted)" : "var(--lime)" }}
      >
        {capped ? "0 points" : `+${awarded} points`}
      </span>

      <p className="cel-body">
        {capped
          ? "The goal still counts. The reward does not, this month."
          : `£${cash} goes into your savings, funded by ${partnerName}. One rate the whole way: ${pointsPerGBP} points = £1.00.`}
      </p>

      {capped && <p className="cel-capped">{message}</p>}

      <div className="cel-actions">
        <button id="celNext" className="btn btn-lime" onClick={onSeeRewards}>
          See rewards
        </button>
        <button className="btn btn-onink" onClick={onBack}>
          Back to goals
        </button>
      </div>
    </div>
  );
}
