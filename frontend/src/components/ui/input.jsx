import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex w-full rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-4 py-2.5",
                "text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)]/60",
                "transition-all duration-200",
                "focus:outline-none focus:border-[var(--blue)]/40 focus:ring-2 focus:ring-[var(--blue)]/15 focus:bg-white/[0.06]",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Input.displayName = "Input";

export { Input };
