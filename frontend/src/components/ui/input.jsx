import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex w-full rounded-[var(--radius-md)] border border-[var(--bg3)] bg-[var(--bg0,#1d2021)] px-3.5 py-2.5",
                "text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)]",
                "transition-colors duration-150",
                "focus:outline-none focus:border-[var(--blue)]",
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
