"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Mirrors Prisma `GenerationStatus` — do not import `@prisma/client` in Client Components (breaks browser bundle). */
type GenerationStatusValue = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

type GenerationStatusPanelProps = {
  proposalCaseId: string;
  generationStatus: GenerationStatusValue;
  generationError: string | null;
};

/** 低频轮询，避免与同页的 Server Action（如分析师确认提交）争抢 router.refresh */
const POLL_INTERVAL_MS = 12_000;

export function GenerationStatusPanel({
  proposalCaseId,
  generationStatus,
  generationError,
}: GenerationStatusPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const refreshPage = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const triggerGeneration = useCallback(async () => {
    try {
      setLocalError(null);
      const response = await fetch(`/api/cases/${proposalCaseId}/generate`, {
        method: "POST",
      });
      if (!response.ok && response.status !== 202) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setLocalError(payload?.error ?? "触发生成失败，请重试。");
      }
    } catch {
      setLocalError("网络异常，未能触发生成。");
    } finally {
      refreshPage();
    }
  }, [proposalCaseId, refreshPage]);

  useEffect(() => {
    if (generationStatus !== "PENDING" || startedRef.current) {
      return;
    }
    startedRef.current = true;
    void triggerGeneration();
  }, [generationStatus, triggerGeneration]);

  useEffect(() => {
    if (generationStatus !== "PENDING" && generationStatus !== "RUNNING") {
      return;
    }

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      refreshPage();
    };

    const timer = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [generationStatus, refreshPage]);

  const canRetry = generationStatus === "FAILED" && !isPending;

  return (
    <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <div className="flex items-start gap-3">
        {(generationStatus === "PENDING" || generationStatus === "RUNNING") && (
          <Loader2 className="mt-0.5 size-4 animate-spin text-cyan-300" aria-hidden />
        )}
        <div className="space-y-1 text-sm">
          <p className="font-medium text-slate-100">
            {generationStatus === "FAILED"
              ? "AI 生成失败"
              : "AI 正在生成草稿，通常需要 1-2 分钟"}
          </p>
          <p className="text-slate-300">
            {generationStatus === "FAILED"
              ? generationError?.trim() || "请检查 AI 配置后重试。"
              : "你可以离开此页面，系统会持续生成。"}
          </p>
          {localError ? <p className="text-rose-300">{localError}</p> : null}
        </div>
      </div>

      {generationStatus === "FAILED" ? (
        <Button
          type="button"
          onClick={() => void triggerGeneration()}
          disabled={!canRetry}
          className="border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
        >
          <RefreshCcw className="mr-2 size-4" aria-hidden />
          重新生成
        </Button>
      ) : null}
    </div>
  );
}
