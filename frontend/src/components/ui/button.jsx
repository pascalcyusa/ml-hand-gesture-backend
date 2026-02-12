import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]",
    {
        variants: {
            variant: {
                default:
                    "bg-[var(--bg2)]/80 text-[var(--fg-dim)] border border-[var(--bg3)]/50 rounded-full backdrop-blur-sm hover:bg-[var(--bg3)] hover:text-[var(--fg)] hover:border-[var(--bg4)]/60 active:scale-[0.97]",
                primary:
                    "bg-[var(--green-dim)] text-[var(--bg-hard)] rounded-full border border-[var(--green)]/30 hover:bg-[var(--green)] hover:shadow-[0_0_24px_rgba(184,187,38,0.25)] active:scale-[0.97]",
                danger:
                    "bg-[var(--red-dim)]/80 text-[var(--fg)] rounded-full border border-[var(--red)]/25 hover:bg-[var(--red)] hover:shadow-[0_0_24px_rgba(251,73,52,0.2)] active:scale-[0.97]",
                accent:
                    "bg-[var(--orange-dim)] text-[var(--bg-hard)] rounded-full border border-[var(--orange)]/30 hover:bg-[var(--orange)] hover:shadow-[0_0_24px_rgba(254,128,25,0.25)] active:scale-[0.97]",
                ghost:
                    "bg-transparent text-[var(--fg-muted)] rounded-full border border-transparent hover:bg-[var(--bg1)]/60 hover:text-[var(--fg)] hover:backdrop-blur-sm active:scale-[0.97]",
                outline:
                    "bg-transparent text-[var(--fg-dim)] rounded-full border border-[var(--bg3)]/60 hover:bg-[var(--bg1)]/40 hover:border-[var(--bg4)]/60 hover:text-[var(--fg)] active:scale-[0.97]",
            },
            size: {
                default: "px-5 py-2.5 text-sm",
                sm: "px-3.5 py-1.5 text-xs",
                lg: "px-7 py-3.5 text-base",
                icon: "h-9 w-9 p-0 rounded-full",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const Button = React.forwardRef(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
