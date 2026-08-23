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

// Shared design language for the whole dashboard — same brand identity as
// ladingpage (dark, gradient-accented): generously rounded fields
// (rounded-2xl), pill buttons (rounded-full), no square corners anywhere.
const fieldBase =
  "w-full rounded-2xl border border-white/10 bg-bg-elevated px-4 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-muted/60 focus:border-violet/60 focus:ring-4 focus:ring-violet/15 disabled:opacity-50";

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
  primary:
    "bg-gradient-to-r from-violet to-magenta text-white shadow-[0_0_30px_-10px_rgba(225,29,156,0.6)] hover:scale-[1.02]",
  secondary: "bg-white/5 text-fg hover:bg-white/10",
  danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20",
  ghost: "text-fg-muted hover:text-fg",
};

const buttonSizes = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
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
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

const cardClassName = "rounded-3xl border border-white/10 bg-bg-elevated p-6";

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
  return <label className={cx("mb-1.5 block text-sm font-medium text-fg-muted", className)}>{children}</label>;
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
      autentic<span className="text-gradient-brand">.ai</span>
    </span>
  );
}
