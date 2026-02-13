import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium font-[var(--font-mono)] transition-colors",
    {
        variants: {
            variant: {
                default: "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/15",
                secondary: "bg-white/[0.06] text-[var(--fg-dim)] border border-white/[0.08]",
                success: "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/15",
                warning: "bg-[var(--gold-dim)]/10 text-[var(--gold-dim)] border border-[var(--gold-dim)]/15",
                danger: "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/15",
                info: "bg-[var(--gold-light)]/10 text-[var(--gold-light)] border border-[var(--gold-light)]/15",
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
