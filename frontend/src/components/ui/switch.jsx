import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../../lib/utils";

const Switch = React.forwardRef(({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
        className={cn(
            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
            "border border-white/[0.08] bg-white/[0.06] transition-all duration-200",
            "data-[state=checked]:bg-[var(--gold-dim)] data-[state=checked]:border-[var(--gold)]/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
        )}
        ref={ref}
        {...props}
    >
        <SwitchPrimitive.Thumb
            className={cn(
                "pointer-events-none block h-[18px] w-[18px] rounded-full shadow-md",
                "bg-[var(--fg-dim)] transition-all duration-200",
                "data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-[var(--gold)]",
                "data-[state=unchecked]:translate-x-[2px]"
            )}
        />
    </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
