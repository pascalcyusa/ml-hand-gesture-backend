import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../../lib/utils";

const Switch = React.forwardRef(({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
        className={cn(
            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
            "border border-[var(--bg3)] bg-[var(--bg2)] transition-colors duration-150",
            "data-[state=checked]:bg-[var(--green-dim)] data-[state=checked]:border-[var(--green)]",
            "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
        )}
        ref={ref}
        {...props}
    >
        <SwitchPrimitive.Thumb
            className={cn(
                "pointer-events-none block h-[18px] w-[18px] rounded-full shadow-sm",
                "bg-[var(--fg-dim)] transition-transform duration-150",
                "data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-[var(--green)]",
                "data-[state=unchecked]:translate-x-[2px]"
            )}
        />
    </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
