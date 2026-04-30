"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logSimilarCaseAction } from "@/app/(app)/cases/actions";

export type SimilarCaseItem = {
  id: string;
  title: string;
  requirementSummary: string | null;
  matchedDimensions: string[];
  semanticScore: number;
  totalScore: number;
  isSameCustomer: boolean;
  organism: string | null;
  productLine: string | null;
  analystConfirmedText: string | null;
};

function MatchBadges({ dimensions }: { dimensions: string[] }) {
  if (dimensions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {dimensions.map((dim) => (
        <Badge key={dim} variant="secondary" className="text-xs">
          {dim}
        </Badge>
      ))}
    </div>
  );
}

function SimilarCaseCard({
  caseItem,
  caseId,
  rank,
}: {
  caseItem: SimilarCaseItem;
  caseId: string;
  rank: number;
}) {
  const [isPending, startTransition] = useTransition();

  const logAction = (action: "similar_case_clicked" | "similar_case_referenced") => {
    const formData = new FormData();
    formData.set("proposalCaseId", caseId);
    formData.set("targetCaseId", caseItem.id);
    formData.set("action", action);
    formData.set("rank", String(rank));
    formData.set("matchedDimensions", caseItem.matchedDimensions.join(","));
    formData.set("semanticScore", String(caseItem.semanticScore));
    startTransition(async () => {
      await logSimilarCaseAction(formData);
    });
  };

  return (
    <article className="space-y-2 rounded-lg border border-border bg-muted p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {caseItem.title}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            {caseItem.organism ? (
              <Badge variant="outline" className="text-xs">{caseItem.organism}</Badge>
            ) : null}
            {caseItem.productLine ? (
              <Badge variant="outline" className="text-xs">{caseItem.productLine}</Badge>
            ) : null}
            {caseItem.isSameCustomer ? (
              <Badge className="text-xs bg-primary/20 text-primary">同客户</Badge>
            ) : null}
          </div>
        </div>
        <Link
          href={`/cases/${caseItem.id}`}
          className="inline-flex items-center text-xs text-primary hover:text-primary/70"
          onClick={() => logAction("similar_case_clicked")}
        >
          查看
          <ArrowUpRight className="ml-1 size-3" aria-hidden />
        </Link>
      </div>

      <MatchBadges dimensions={caseItem.matchedDimensions} />

      <p className="text-xs text-muted-foreground">
        语义相似度: {caseItem.semanticScore.toFixed(2)}
      </p>

      <p className="whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
        {caseItem.requirementSummary?.trim() || "该案例暂无结构化需求摘要。"}
      </p>

      {caseItem.analystConfirmedText?.trim() ? (
        <p className="line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-muted-foreground/70">
          最近确认方案：{caseItem.analystConfirmedText}
        </p>
      ) : null}

      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          className="rounded border-input"
          disabled={isPending}
          onChange={(e) => {
            if (e.target.checked) {
              logAction("similar_case_referenced");
            }
          }}
        />
        参考此案例
      </label>
    </article>
  );
}

export function SimilarCasesPanel({
  cases,
  caseId,
}: {
  cases: SimilarCaseItem[];
  caseId: string;
}) {
  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>相似历史案例</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cases.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/60 p-4 text-sm text-muted-foreground">
            暂无相似案例
          </div>
        ) : (
          cases.map((caseItem, index) => (
            <SimilarCaseCard
              key={caseItem.id}
              caseItem={caseItem}
              caseId={caseId}
              rank={index + 1}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
