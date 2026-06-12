import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANT: Record<Variant, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all",
  ghost:
    "bg-transparent hover:bg-accent/50 text-foreground transition-colors",
  outline:
    "border border-border bg-transparent hover:bg-accent/30 hover:border-primary/50 text-foreground transition-all",
  destructive:
    "bg-destructive text-white hover:bg-destructive/90 shadow-md transition-all",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
