import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium font-[var(--font-mono)] transition-colors",
    {
        variants: {
            variant: {
                default: "bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/15",
                secondary: "bg-white/[0.06] text-[var(--fg-dim)] border border-white/[0.08]",
                success: "bg-[var(--aqua)]/10 text-[var(--aqua)] border border-[var(--aqua)]/15",
                warning: "bg-[var(--yellow)]/10 text-[var(--yellow)] border border-[var(--yellow)]/15",
                danger: "bg-[var(--red)]/10 text-[var(--red)] border border-[var(--red)]/15",
                info: "bg-[var(--blue)]/10 text-[var(--aqua)] border border-[var(--blue)]/15",
                outline: "border border-white/[0.1] text-[var(--fg-dim)] bg-transparent",
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
