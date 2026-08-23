import type { AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 inline-flex items-center gap-2 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-[0.25em] text-fg-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet to-magenta" />
      {children}
    </p>
  );
}

export function SectionHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`font-[family-name:var(--font-display)] text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-6xl ${className}`}
    >
      {children}
    </h2>
  );
}

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: "solid" | "outline" };

export function GradientButton({ href, variant = "solid", className = "", children, ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-wide transition-transform hover:scale-[1.03] active:scale-[0.98]";
  const solid = "bg-gradient-to-r from-violet to-magenta text-white shadow-[0_0_40px_-10px_rgba(225,29,156,0.6)]";
  const outline = "border border-white/20 text-fg hover:border-white/40 hover:bg-white/5";
  return (
    <Link href={href} className={`${base} ${variant === "solid" ? solid : outline} ${className}`} {...props}>
      {children}
    </Link>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border border-border bg-bg-elevated p-6 ${className}`}>{children}</div>
  );
}
