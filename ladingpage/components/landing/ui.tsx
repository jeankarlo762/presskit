import type { AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[1240px] px-4 sm:px-8 ${className}`}>{children}</div>;
}

export function SectionHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-display text-4xl leading-[1.02] uppercase sm:text-5xl ${className}`}>{children}</h2>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: "primary" | "outline";
  size?: "md" | "lg";
};

export function ButtonLink({ href, variant = "primary", size = "md", className = "", children, ...props }: ButtonLinkProps) {
  const base =
    "inline-flex min-h-11 items-center justify-center rounded-xl text-center font-bold transition-colors";
  const sizes = { md: "px-5 py-3 text-[15px]", lg: "px-6 py-4 text-[17px]" };
  const variants = {
    primary: "bg-action text-white hover:bg-action-hover",
    outline: "border border-line-strong text-fg hover:border-white/40 hover:bg-white/5",
  };
  return (
    <Link href={href} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
