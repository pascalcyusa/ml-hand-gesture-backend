import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-150 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none",
    {
        variants: {
            variant: {
                default:
                    "bg-[var(--bg2)] text-[var(--fg)] border-2 border-transparent rounded-[var(--radius-md)] hover:bg-[var(--bg3)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-px active:translate-y-0",
                primary:
                    "bg-[var(--green-dim)] text-[var(--bg-hard)] border-2 border-[var(--green)] rounded-[var(--radius-md)] hover:bg-[var(--green)] hover:shadow-[0_0_20px_rgba(184,187,38,0.3)]",
                danger:
                    "bg-[var(--red-dim)] text-[var(--fg)] border-2 border-[var(--red)] rounded-[var(--radius-md)] hover:bg-[var(--red)] hover:shadow-[0_0_20px_rgba(251,73,52,0.3)]",
                accent:
                    "bg-[var(--orange-dim)] text-[var(--bg-hard)] border-2 border-[var(--orange)] rounded-[var(--radius-md)] hover:bg-[var(--orange)] hover:shadow-[0_0_20px_rgba(254,128,25,0.3)]",
                ghost:
                    "bg-transparent text-[var(--fg-muted)] border-2 border-transparent rounded-[var(--radius-md)] hover:bg-[var(--bg1)] hover:text-[var(--fg)]",
                outline:
                    "bg-transparent text-[var(--fg-dim)] border-2 border-[var(--bg3)] rounded-[var(--radius-md)] hover:bg-[var(--bg1)] hover:border-[var(--bg4)]",
            },
            size: {
                default: "px-4 py-2 text-sm",
                sm: "px-2 py-1 text-xs rounded-[var(--radius-sm)]",
                lg: "px-6 py-3 text-base rounded-[var(--radius-lg)]",
                icon: "h-8 w-8 p-0 rounded-[var(--radius-md)]",
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
