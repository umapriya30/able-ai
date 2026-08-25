export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  style,
  id,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
  id?: string;
}) {
  return (
    <button id={id} type={type} className="btn" onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button type="button" className="btn btn-ghost" onClick={onClick} style={style}>
      {children}
    </button>
  );
}
