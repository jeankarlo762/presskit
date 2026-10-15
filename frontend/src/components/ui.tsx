import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  FormHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Shared design language for the whole dashboard (redesign 2026-10): dark
// ground, one solid magenta for the action the artist came to do, 12px
// radii on fields and buttons, 16px on cards, 44px minimum touch targets.
const fieldBase =
  "w-full min-h-11 rounded-xl border border-white/15 bg-bg px-4 py-3 text-[15px] text-fg outline-none transition placeholder:text-fg-muted/70 focus:border-primary-text focus:ring-2 focus:ring-primary/30 disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cx(fieldBase, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cx(fieldBase, "resize-none", className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={cx(fieldBase, "cursor-pointer pr-8", className)} {...props} />;
});

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-white/20 bg-transparent text-fg hover:bg-white/5",
  danger: "border border-red-400/30 bg-transparent text-red-300 hover:bg-red-500/10",
  ghost: "text-fg-muted hover:bg-white/5 hover:text-fg",
};

const buttonSizes = {
  md: "min-h-11 px-5 py-2.5 text-[15px]",
  sm: "min-h-9 px-3.5 py-1.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: keyof typeof buttonSizes }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

const cardClassName = "rounded-2xl border border-border bg-bg-elevated p-6";

type CardDivProps = { as?: "div"; className?: string; children: ReactNode } & Omit<
  HTMLAttributes<HTMLDivElement>,
  "className" | "children"
>;
type CardFormProps = { as: "form"; className?: string; children: ReactNode } & Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "className" | "children"
>;

export function Card(props: CardDivProps | CardFormProps) {
  const { className, children, ...rest } = props;
  if (props.as === "form") {
    const { as: _as, ...formProps } = rest as Omit<CardFormProps, "className" | "children">;
    return (
      <form className={cx(cardClassName, className)} {...formProps}>
        {children}
      </form>
    );
  }
  const { as: _as, ...divProps } = rest as Omit<CardDivProps, "className" | "children">;
  return (
    <div className={cx(cardClassName, className)} {...divProps}>
      {children}
    </div>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={cx("mb-2 block text-sm font-bold text-fg", className)}>{children}</label>;
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-red-400">{children}</p>;
}

export function GrainOverlay() {
  return <div className="grain-overlay" aria-hidden />;
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("font-display uppercase tracking-tight", className)}>
      presskit<span className="text-primary-text">.ai</span>
    </span>
  );
}
