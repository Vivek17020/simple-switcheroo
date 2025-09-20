import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const toggleVariants = cva(
  "relative inline-flex items-center cursor-pointer transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-7 w-14",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const trackVariants = cva(
  "absolute inset-0 rounded-full transition-all duration-300 ease-out shadow-inner",
  {
    variants: {
      size: {
        sm: "rounded-full",
        md: "rounded-full", 
        lg: "rounded-full",
      },
      checked: {
        true: "bg-toggle-track-active shadow-[0_0_20px_var(--toggle-glow)]",
        false: "bg-toggle-track-inactive",
      },
    },
    defaultVariants: {
      size: "md",
      checked: false,
    },
  }
);

const thumbVariants = cva(
  "absolute top-0.5 bg-toggle-thumb rounded-full shadow-lg transition-all duration-300 ease-out transform",
  {
    variants: {
      size: {
        sm: "h-4 w-4 left-0.5",
        md: "h-5 w-5 left-0.5",
        lg: "h-6 w-6 left-0.5",
      },
      checked: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        size: "sm",
        checked: true,
        className: "translate-x-4",
      },
      {
        size: "md", 
        checked: true,
        className: "translate-x-5",
      },
      {
        size: "lg",
        checked: true,
        className: "translate-x-7",
      },
    ],
    defaultVariants: {
      size: "md",
      checked: false,
    },
  }
);

export interface ToggleButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">,
    VariantProps<typeof toggleVariants> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
}

const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ className, size, checked = false, onChange, label, disabled, ...props }, ref) => {
    const handleToggle = () => {
      if (!disabled && onChange) {
        onChange(!checked);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        handleToggle();
      }
    };

    return (
      <div className="flex items-center gap-3">
        <button
          ref={ref}
          role="switch"
          aria-checked={checked}
          aria-label={label}
          className={cn(toggleVariants({ size, className }))}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          {...props}
        >
          <span className={cn(trackVariants({ size, checked }))} />
          <span className={cn(thumbVariants({ size, checked }))} />
        </button>
        {label && (
          <span className="text-sm font-medium text-foreground select-none">
            {label}
          </span>
        )}
      </div>
    );
  }
);

ToggleButton.displayName = "ToggleButton";

export { ToggleButton, toggleVariants };