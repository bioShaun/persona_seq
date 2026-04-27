import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RevisionItem = {
  id: string;
  revisionNumber: number;
  customerFeedbackText: string | null;
  revisionNotes: string | null;
  confirmedByAnalystAt: Date | null;
  sentToCustomerAt: Date | null;
};

const datetimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: Date | null) {
  return value ? datetimeFormatter.format(value) : "未记录";
}

export function RevisionTimeline({ revisions }: { revisions: RevisionItem[] }) {
  return (
    <Card className="border-slate-700 bg-slate-950/70 text-slate-100">
      <CardHeader>
        <CardTitle>修订时间线</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {revisions.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
            当前还没有修订记录。
          </p>
        ) : (
          revisions.map((revision) => (
            <article
              key={revision.id}
              className="rounded-lg border border-slate-800 bg-slate-900/70 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-100">
                第 {revision.revisionNumber} 轮
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {revision.customerFeedbackText?.trim() || "首轮方案"}
              </p>
              {revision.revisionNotes?.trim() ? (
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-cyan-200/90">
                  修订说明：{revision.revisionNotes}
                </p>
              ) : null}
              <dl className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">分析师确认</dt>
                  <dd>{formatDateTime(revision.confirmedByAnalystAt)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">发送客户</dt>
                  <dd>{formatDateTime(revision.sentToCustomerAt)}</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
