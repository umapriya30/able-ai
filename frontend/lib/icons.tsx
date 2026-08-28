// Computed icon geometry, ported from prototype/index.html's ICONS/polar/arcPath/starPoints.
// Never hand-write path data — these three helpers emit coordinates. 24px viewBox,
// currentColor, 1.5px stroke. No emoji, no icon font.

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return (
    "M" +
    x0.toFixed(2) +
    " " +
    y0.toFixed(2) +
    "A" +
    r +
    " " +
    r +
    " 0 " +
    (a1 - a0 > 180 ? 1 : 0) +
    " 1 " +
    x1.toFixed(2) +
    " " +
    y1.toFixed(2)
  );
}

function starPoints(cx: number, cy: number, rOut: number, rIn: number, n: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const [x, y] = polar(cx, cy, i % 2 ? rIn : rOut, (i * 180) / n);
    pts.push(x.toFixed(2) + "," + y.toFixed(2));
  }
  return pts.join(" ");
}

export type IconName =
  | "home"
  | "goals"
  | "habits"
  | "you"
  | "settings"
  | "plus"
  | "coffee"
  | "eating_out"
  | "subs"
  | "transport"
  | "lunch"
  | "gaming"
  | "shopping"
  | "mark";

const Wrap = ({ children, size = 20 }: { children: React.ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  switch (name) {
    case "home":
      return (
        <Wrap size={size}>
          <polyline points="4,11 12,4 20,11" />
          <path d="M6.5 9.5V19a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9.5" />
        </Wrap>
      );
    case "goals":
      return (
        <Wrap size={size}>
          <line x1="6" y1="4" x2="6" y2="20" />
          <polyline points="6,6 17,9.5 6,13" />
        </Wrap>
      );
    case "habits":
      return (
        <Wrap size={size}>
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <polyline points="8.5,12.4 11,14.9 15.5,9.6" />
        </Wrap>
      );
    case "you":
      return (
        <Wrap size={size}>
          <polygon points={starPoints(12, 12, 8, 3.4, 5)} />
        </Wrap>
      );
    case "settings":
      // The dial from design board 04 — a control you turn, not a cog.
      return (
        <Wrap size={size}>
          <circle cx="12" cy="12" r="3.6" />
          <circle cx="12" cy="12" r="8.6" />
          <path d="M12 1.2v2.4M12 20.4v2.4M1.2 12h2.4M20.4 12h2.4" />
        </Wrap>
      );
    case "plus":
      return (
        <Wrap size={size}>
          <path d="M12 5v14M5 12h14" />
        </Wrap>
      );
    case "coffee":
      return (
        <Wrap size={size}>
          <path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" />
          <path d={arcPath(16, 11, 3, 20, 160)} />
          <line x1="5" y1="21" x2="17" y2="21" />
        </Wrap>
      );
    case "eating_out":
      return (
        <Wrap size={size}>
          <line x1="8" y1="3" x2="8" y2="21" />
          <path d="M5 3v5a3 3 0 0 0 6 0V3" />
          <line x1="17" y1="12" x2="17" y2="21" />
          <path d="M17 12c2 0 2-3 2-5s-2-4-2-4Z" />
        </Wrap>
      );
    case "subs":
      return (
        <Wrap size={size}>
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <line x1="3" y1="10.5" x2="21" y2="10.5" />
          <line x1="7" y1="14.5" x2="11" y2="14.5" />
        </Wrap>
      );
    case "transport":
      return (
        <Wrap size={size}>
          <rect x="4" y="4" width="16" height="12" rx="3" />
          <line x1="4" y1="11" x2="20" y2="11" />
          <circle cx="8" cy="19" r="1.6" />
          <circle cx="16" cy="19" r="1.6" />
        </Wrap>
      );
    case "lunch":
      return (
        <Wrap size={size}>
          <rect x="3" y="8" width="18" height="12" rx="3" />
          <path d={arcPath(12, 8, 4, 290, 70)} />
        </Wrap>
      );
    case "gaming":
      return (
        <Wrap size={size}>
          <rect x="2.5" y="7" width="19" height="10" rx="5" />
          <line x1="7" y1="10" x2="7" y2="14" />
          <line x1="5" y1="12" x2="9" y2="12" />
          <circle cx="16" cy="11.5" r="1.1" />
          <circle cx="18.5" cy="13.5" r="1.1" />
        </Wrap>
      );
    case "shopping":
      // not in the prototype's curated set (only shows up via AI-generated habits) —
      // reuses the subs glyph shape family (bag-ish rect) rather than guessing new path data.
      return (
        <Wrap size={size}>
          <path d="M6 8h12l-1 12H7Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </Wrap>
      );
    case "mark":
      // The product's own device at icon scale: a rail, a goalpost, and the
      // marker sitting *on* it. It previously drew the marker at x=8 with the
      // post at x=15 — a marker still short of the goal, on the button that
      // declares arrival. Same coordinate for both is the whole meaning.
      return (
        <Wrap size={size}>
          <path d="M4 12.5l5 5L20 6.5" />
        </Wrap>
      );
    default:
      return (
        <Wrap size={size}>
          <rect x="3" y="6" width="18" height="12" rx="3" />
        </Wrap>
      );
  }
}

const CATEGORY_TO_ICON: Record<string, IconName> = {
  coffee: "coffee",
  eating_out: "eating_out",
  subs: "subs",
  transport: "transport",
  lunch: "lunch",
  gaming: "gaming",
  shopping: "shopping",
};

export function iconForCategory(categoryId: string): IconName {
  return CATEGORY_TO_ICON[categoryId] ?? "subs";
}
