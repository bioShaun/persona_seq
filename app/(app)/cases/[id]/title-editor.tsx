"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Pencil, RefreshCcw, X } from "lucide-react";
import { updateCaseTitle } from "@/app/(app)/cases/actions";
import { Input } from "@/components/ui/input";

type TitleEditorProps = {
  proposalCaseId: string;
  initialTitle: string;
};

export function TitleEditor({ proposalCaseId, initialTitle }: TitleEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [previousInitialTitle, setPreviousInitialTitle] = useState(initialTitle);
  const [draft, setDraft] = useState(initialTitle);
  const [regenerating, setRegenerating] = useState(false);

  if (initialTitle !== previousInitialTitle) {
    setPreviousInitialTitle(initialTitle);
    setDraft(initialTitle);
  }

  const handleSave = async () => {
    if (!draft.trim() || draft === initialTitle) {
      setEditing(false);
      return;
    }
    const formData = new FormData();
    formData.set("proposalCaseId", proposalCaseId);
    formData.set("title", draft.trim());
    startTransition(async () => {
      await updateCaseTitle(formData);
      setEditing(false);
      router.refresh();
    });
  };

  const handleCancel = () => {
    setDraft(initialTitle);
    setEditing(false);
  };

  const handleRegenerateTitle = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/cases/${proposalCaseId}/regenerate-title`, {
        method: "POST",
      });
      if (!res.ok) {
        console.error("Title regeneration failed");
      }
    } catch {
      console.error("Title regeneration network error");
    } finally {
      setRegenerating(false);
      router.refresh();
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <form
          action={async () => {
            await handleSave();
          }}
          className="flex flex-1 items-center gap-2"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="border-input bg-background text-lg font-semibold text-foreground"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleSave();
              }
              if (e.key === "Escape") {
                handleCancel();
              }
            }}
          />
          <button
            type="submit"
            disabled={isPending || !draft.trim()}
            className="rounded p-1 text-emerald-600 transition-colors hover:text-emerald-700 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {draft}
      </h1>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="编辑标题"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => void handleRegenerateTitle()}
        disabled={regenerating}
        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        title="重新生成标题"
      >
        {regenerating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCcw className="size-4" />
        )}
      </button>
    </div>
  );
}
