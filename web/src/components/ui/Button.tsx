import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

const VARIANTS = {
  default:
    "min-h-11 gap-2 rounded-control border border-line bg-surface px-4.5 font-semibold text-ink hover:not-data-disabled:bg-surface-sunk",
  primary:
    "min-h-11 gap-2 rounded-control border border-transparent bg-accent px-4.5 font-semibold text-accent-text hover:not-data-disabled:bg-accent-hover",
  /** A button that reads as a link inside a sentence. */
  link: "text-accent underline",
} as const;

export interface ButtonProps extends Omit<ComponentProps<typeof BaseButton>, "className"> {
  variant?: keyof typeof VARIANTS;
  className?: string;
}

/** The page's button, on Base UI's Button. A disabled one fades; `link` sits inside a line of text. */
export function Button({ variant = "default", className, ...props }: ButtonProps) {
  return (
    <BaseButton
      {...props}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center data-disabled:cursor-default data-disabled:opacity-60",
        VARIANTS[variant],
        className,
      )}
    />
  );
}
