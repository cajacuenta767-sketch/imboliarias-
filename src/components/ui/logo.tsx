import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden>
      <defs>
        <linearGradient id="hb-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#hb-g)" />
      <path d="M11 20.5 20 12l9 8.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 19v9h12v-9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 28v-5h4v5" fill="#fff" opacity=".9" />
    </svg>
  );
}

export function Logo({ name = "Habitta", light = false, href = "/", className }: { name?: string; light?: boolean; href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight", light ? "text-white" : "text-ink", className)}>
      <LogoMark />
      <span>
        {name}
        <span className="text-brand">.</span>
      </span>
    </Link>
  );
}
