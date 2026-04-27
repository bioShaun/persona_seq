"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  idleText: string;
  pendingText: string;
  className?: string;
};

export function SubmitButton({
  idleText,
  pendingText,
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
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
