"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = {
  idleText: string;
  pendingText: string;
  variant?: ButtonProps["variant"];
  className?: string;
};

export function SubmitButton({
  idleText,
  pendingText,
  variant = "default",
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      aria-disabled={pending}
      className={className}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          {pendingText}
        </>
      ) : (
        <>
          <Sparkles className="mr-2 size-4" aria-hidden />
          {idleText}
        </>
      )}
    </Button>
  );
}
