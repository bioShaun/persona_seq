"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { confirmCurrentRevision } from "@/app/(app)/cases/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProposalEditorProps = {
  proposalCaseId: string;
  revisionId: string;
  initialText: string;
};

export function ProposalEditor({
  proposalCaseId,
  revisionId,
  initialText,
}: ProposalEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        setIsSubmitting(true);
        try {
          await confirmCurrentRevision(formData);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <input type="hidden" name="proposalCaseId" value={proposalCaseId} />
      <input type="hidden" name="revisionId" value={revisionId} />

      <div className="space-y-2">
        <Label htmlFor="analyst-confirmed-text">分析师确认方案</Label>
        <Textarea
          id="analyst-confirmed-text"
          name="analystConfirmedText"
          rows={18}
          required
          defaultValue={initialText}
          className="border-border bg-muted/90 font-mono text-sm leading-6 text-foreground placeholder:text-muted-foreground"
          placeholder="在此确认并微调发送给客户的正式方案文本。"
        />
      </div>

      <div className="flex items-center justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
          className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              保存确认中...
            </>
          ) : (
            "确认当前方案"
          )}
        </Button>
      </div>
    </form>
  );
}
