"use client";

import { useEffect, useRef } from "react";
import { PrimaryButton } from "./Buttons";

interface Shard {
  x: number;
  y: number;
  vy: number;
  rot: number;
  vr: number;
  s: number;
}

export function CelebrationOverlay({
  open,
  emoji,
  goalName,
  awarded,
  capped,
  message,
  onNext,
}: {
  open: boolean;
  emoji: string;
  goalName: string;
  awarded: number;
  capped: boolean;
  message: string;
  onNext: () => void;
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

  return (
    <div className="celebrate" data-open={open ? "true" : "false"} role="dialog" aria-modal="true" aria-labelledby="celTitle">
      {!capped && <div className="bloom" />}
      <canvas ref={canvasRef} />
      <span style={{ fontSize: 31, position: "relative" }}>{emoji}</span>
      <h2 className="h-lg" id="celTitle" style={{ position: "relative" }}>
        Goal reached
      </h2>
      <p className="small" style={{ margin: 0, opacity: 0.8, position: "relative" }}>
        {goalName}
      </p>
      <span
        className="num"
        style={{ position: "relative", fontSize: capped ? 25 : undefined, color: capped ? "var(--slip-on-ink)" : "var(--lime)" }}
      >
        +{awarded}
      </span>
      <p className="cap">{message}</p>
      <PrimaryButton id="celNext" onClick={onNext}>
        Set the next goal
      </PrimaryButton>
    </div>
  );
}
