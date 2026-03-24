import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
  }
>;

export const Button = ({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
      variant === "primary" &&
        "bg-ink text-white shadow-lg shadow-ink/10 hover:bg-teal",
      variant === "secondary" &&
        "border border-white/60 bg-white/80 text-ink hover:bg-white",
      variant === "ghost" &&
        "text-slate-600 hover:bg-white/70 hover:text-ink",
      variant === "danger" &&
        "bg-coral text-white hover:bg-coral/90",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

