import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-md border p-4 shadow-md transition-all",
  {
    variants: {
      variant: {
        default: "border-neutral-200 bg-white text-neutral-950",
        destructive: "border-red-200 bg-red-50 text-red-900"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export type ToastProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof toastVariants> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type ToastActionElement = React.ReactElement;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed top-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2 outline-none",
        className
      )}
      {...props}
    />
  )
);
ToastViewport.displayName = "ToastViewport";

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, open = true, ...props }, ref) => {
    if (!open) {
      return null;
    }

    return <div ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />;
  }
);
Toast.displayName = "Toast";

export const ToastTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h3 ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
);
ToastTitle.displayName = "ToastTitle";

export const ToastDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
);
ToastDescription.displayName = "ToastDescription";

export const ToastClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-neutral-300 text-xs hover:bg-neutral-100",
        className
      )}
      {...props}
    >
      {children ?? "X"}
    </button>
  )
);
ToastClose.displayName = "ToastClose";

export const ToastAction = React.forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn("inline-flex items-center rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100", className)}
      {...props}
    >
      {children}
    </button>
  )
);
ToastAction.displayName = "ToastAction";
