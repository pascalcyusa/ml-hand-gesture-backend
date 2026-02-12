import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold font-[var(--font-mono)] transition-colors",
    {
        variants: {
            variant: {
                default: "bg-[rgba(184,187,38,0.15)] text-[var(--green)]",
                secondary: "bg-[var(--bg2)] text-[var(--fg-dim)]",
                success: "bg-[rgba(142,192,124,0.15)] text-[var(--aqua)]",
                warning: "bg-[rgba(250,189,47,0.15)] text-[var(--yellow)]",
                danger: "bg-[rgba(251,73,52,0.15)] text-[var(--red)]",
                info: "bg-[rgba(131,165,152,0.12)] text-[var(--aqua)] border border-[rgba(131,165,152,0.2)]",
                outline: "border border-[var(--bg3)] text-[var(--fg-dim)]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

function Badge({ className, variant, ...props }) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
