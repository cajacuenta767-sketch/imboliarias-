import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";

const tones: Record<string, string> = {
  SALE: "bg-brand-soft text-brand-strong",
  RENT: "bg-rent-soft text-rent",
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  PAID: "bg-emerald-50 text-emerald-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  OPEN: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  NEW: "bg-amber-50 text-amber-700",
  RESERVED: "bg-amber-50 text-amber-700",
  DRAFT: "bg-slate-100 text-slate-600",
  READ: "bg-sky-50 text-sky-700",
  REPLIED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-red-50 text-red-700",
  FAILED: "bg-red-50 text-red-700",
  CLOSED: "bg-slate-100 text-slate-600",
  SOLD: "bg-slate-800 text-white",
  RENTED: "bg-slate-800 text-white",
  HIDDEN: "bg-slate-100 text-slate-600",
  REFUNDED: "bg-slate-100 text-slate-600",
  SELLING: "bg-brand-soft text-brand-strong",
  BUILDING: "bg-amber-50 text-amber-700",
  FINISHED: "bg-emerald-50 text-emerald-700",
  COMING_SOON: "bg-sky-50 text-sky-700",
  ADMIN: "bg-ink text-white",
  AGENT: "bg-brand-soft text-brand-strong",
  CUSTOMER: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ value, className, label }: { value: string; className?: string; label?: string }) {
  return <span className={cn("chip", tones[value] ?? "bg-slate-100 text-slate-600", className)}>{label ?? STATUS_LABELS[value] ?? value}</span>;
}

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "brand" | "accent" | "dark" | "danger" | "success"; className?: string }) {
  const map = {
    neutral: "bg-muted text-ink-soft",
    brand: "bg-brand-soft text-brand-strong",
    accent: "bg-accent-soft text-accent-strong",
    dark: "bg-ink text-white",
    danger: "bg-red-50 text-red-700",
    success: "bg-emerald-50 text-emerald-700",
  };
  return <span className={cn("chip", map[tone], className)}>{children}</span>;
}
