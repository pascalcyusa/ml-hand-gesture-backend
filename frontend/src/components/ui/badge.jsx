import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium font-[var(--font-mono)] transition-colors",
    {
        variants: {
            variant: {
                default: "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/15",
                secondary: "bg-white/[0.06] text-[var(--fg-dim)] border border-white/[0.08]",
                success: "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/15",
                warning: "bg-[var(--primary-dim)]/10 text-[var(--primary-dim)] border border-[var(--primary-dim)]/15",
                danger: "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/15",
                info: "bg-[var(--primary-light)]/10 text-[var(--primary-light)] border border-[var(--primary-light)]/15",
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
