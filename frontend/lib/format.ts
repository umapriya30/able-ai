export function money(n: number): string {
  return "£" + n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
}

export function money2(n: number): string {
  return "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function monthKey(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

export function monthName(d: Date): string {
  return d.toLocaleString("en-GB", { month: "long" });
}
