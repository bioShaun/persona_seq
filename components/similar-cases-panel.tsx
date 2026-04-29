import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SimilarCaseItem = {
  id: string;
  title: string;
  requirementSummary: string | null;
  matchedReason: string;
  revisions: Array<{
    id: string;
    revisionNumber: number;
    analystConfirmedText: string | null;
  }>;
};

export function SimilarCasesPanel({ cases }: { cases: SimilarCaseItem[] }) {
  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>相似历史案例</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cases.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/60 p-4 text-sm text-muted-foreground">
            暂无匹配的已同意历史案例，后续可根据当前案例沉淀知识库。
          </div>
        ) : (
          cases.map((caseItem) => (
            <article
              key={caseItem.id}
              className="space-y-2 rounded-lg border border-border bg-muted p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {caseItem.title}
                </h3>
                <Link
                  href={`/cases/${caseItem.id}`}
                  className="inline-flex items-center text-xs text-cyan-300 hover:text-cyan-200"
                >
                  查看
                  <ArrowUpRight className="ml-1 size-3" aria-hidden />
                </Link>
              </div>

              <p className="text-xs text-cyan-200/90">{caseItem.matchedReason}</p>

              <p className="whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                {caseItem.requirementSummary?.trim() || "该案例暂无结构化需求摘要。"}
              </p>

              {caseItem.revisions[0]?.analystConfirmedText?.trim() ? (
                <p className="line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-muted-foreground/70">
                  最近确认方案：{caseItem.revisions[0].analystConfirmedText}
                </p>
              ) : null}
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
