type ChipVariant = "default" | "mo" | "slip" | "lime" | "sel";

const VARIANT_CLASS: Record<ChipVariant, string> = {
  default: "chip",
  mo: "chip chip-mo",
  slip: "chip chip-slip",
  lime: "chip chip-lime",
  sel: "chip chip-sel",
};

export function Chip({
  children,
  variant = "default",
  className = "",
  style,
  onClick,
}: {
  children: React.ReactNode;
  variant?: ChipVariant;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const cls = `${VARIANT_CLASS[variant]}${className ? " " + className : ""}`;
  if (onClick) {
    return (
      <button type="button" className={cls} style={style} onClick={onClick}>
        {children}
      </button>
    );
  }
  return (
    <span className={cls} style={style}>
      {children}
    </span>
  );
}
