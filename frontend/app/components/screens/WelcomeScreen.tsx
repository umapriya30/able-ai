// Welcome — design board 01. The brandmark is the board's own geometry: an ink
// ribbon "A" with the momentum arrow rising through it. Green appears on the
// arrow only, because the arrow is the thing that moves.
export function Brandmark({ size = 88 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" role="img" aria-label="Able AI">
      <path
        d="M26 104L58 28L90 104"
        stroke="var(--ink)"
        strokeWidth={17}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 88C42 86 46 68 64 63C79 59 86 50 97 36"
        stroke="var(--momentum)"
        strokeWidth={13}
        strokeLinecap="round"
      />
      <path d="M112 16L107 44L86 28Z" fill="var(--momentum)" />
    </svg>
  );
}

export function WelcomeScreen({
  onGetStarted,
  onLogIn,
}: {
  onGetStarted: () => void;
  onLogIn: () => void;
}) {
  return (
    <section className="screen" data-screen="welcome">
      <div className="col" style={{ gap: 28, paddingTop: 24 }}>
        <div className="row" style={{ justifyContent: "flex-start", gap: 14 }}>
          <Brandmark />
          <div className="col" style={{ gap: 8 }}>
            <span className="num wordmark">ABLE AI</span>
            <span className="eyebrow">
              Turning little habits
              <br />
              into big benefits
            </span>
          </div>
        </div>

        <div className="col" style={{ gap: 14 }}>
          <h1 className="num hero-line">Building financial habits to reach your goals — in weeks.</h1>
          <span className="eyebrow">Reads your real spending · cuts the wait</span>
        </div>
      </div>

      <div className="col" style={{ marginTop: "auto", gap: 12 }}>
        <button className="btn" onClick={onGetStarted}>
          Get started
        </button>
        <button className="btn btn-ghost" onClick={onLogIn}>
          Log in
        </button>
        <span className="eyebrow" style={{ textAlign: "center", paddingTop: 4 }}>
          Read-only bank access · revoke anytime
        </span>
      </div>
    </section>
  );
}
