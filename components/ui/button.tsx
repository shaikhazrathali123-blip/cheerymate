import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-extrabold transition-[transform,background,opacity,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "brand-gradient text-brand-ink pop pop-press",
        dark: "bg-ink text-bg pop pop-press",
        sunny: "bg-sun text-pastel-ink pop pop-press",
        secondary: "bg-surface text-ink pop pop-press",
        glass: "glass text-ink shadow-soft active:scale-95",
        soft: "bg-brand-soft text-brand active:scale-95",
        ghost: "text-ink hover:bg-surface-2 active:scale-95",
        danger: "bg-danger text-white pop pop-press",
        link: "text-brand underline-offset-4 hover:underline px-0 h-auto min-h-0",
      },
      size: {
        sm: "h-10 min-h-[40px] rounded-full px-4 text-sm",
        md: "h-12 min-h-[44px] rounded-full px-6 text-[15px]",
        lg: "h-14 rounded-full px-7 text-base",
        icon: "size-11 rounded-full",
        "icon-lg": "size-16 rounded-full",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
