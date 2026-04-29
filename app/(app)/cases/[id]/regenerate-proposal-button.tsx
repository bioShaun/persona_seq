"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type RegenerateProposalButtonProps = {
  proposalCaseId: string;
  disabled?: boolean;
};

export function RegenerateProposalButton({
  proposalCaseId,
  disabled,
}: RegenerateProposalButtonProps) {
  const router = useRouter();
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${proposalCaseId}/regenerate-proposal`, {
        method: "POST",
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "重新生成失败，请重试。");
        return;
      }
      router.refresh();
    } catch {
      setError("网络异常，未能重新生成。");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div>
      <Button
        type="button"
        onClick={() => void handleRegenerate()}
        disabled={disabled || regenerating}
        variant="outline"
        size="sm"
        className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 disabled:opacity-50"
      >
        {regenerating ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            生成中...
          </>
        ) : (
          <>
            <RefreshCcw className="mr-2 size-4" aria-hidden />
            重新生成完整方案
          </>
        )}
      </Button>
      {error ? <p className="mt-1 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
