import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

const VARIANTS = {
  default:
    "min-h-12 gap-2 rounded-control bg-control px-4 text-small font-semibold text-ink hover:not-data-disabled:bg-control-hover active:not-data-disabled:bg-control-raised active:not-data-disabled:shadow-[inset_0_0_0_1px_var(--color-outline)] wide:min-h-10",
  primary:
    "min-h-12 gap-2 rounded-control bg-accent px-4 text-small font-semibold text-accent-text hover:not-data-disabled:bg-accent-hover active:not-data-disabled:bg-accent-hover wide:min-h-11",
  /** A button that reads as a link inside a sentence. */
  link: "text-accent underline underline-offset-3 hover:text-accent-hover",
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
        "inline-flex cursor-pointer items-center justify-center data-disabled:cursor-default data-disabled:opacity-55",
        VARIANTS[variant],
        className,
      )}
    />
  );
}
