import * as React from "react";

export type ToastProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type ToastActionElement = React.ReactElement;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const ToastViewport = () => null;
export const Toast = ({ children, ...props }: ToastProps) => <div {...props}>{children}</div>;
export const ToastTitle = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 {...props}>{children}</h3>;
export const ToastDescription = ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>;
export const ToastClose = () => null;
export const ToastAction = ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) => <button type="button" {...props}>{children}</button>;
