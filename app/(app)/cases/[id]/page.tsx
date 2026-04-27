import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProposalCaseDetail } from "@/lib/db/proposal-repository";

type CaseDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CaseDetailPlaceholderPage({
  params,
}: CaseDetailPageProps) {
  const { id } = await params;
  const proposalCase = await getProposalCaseDetail(id);

  if (!proposalCase) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-50">
          {proposalCase.title}
        </h2>
        <p className="text-sm text-slate-300">
          当前页面为临时占位版本，用于承接案例跳转；完整的分析师评审工作台将在 Task 10
          继续完善。
        </p>
      </header>

      <Card className="border-slate-700 bg-slate-950/70 text-slate-100">
        <CardHeader className="space-y-3">
          <CardTitle className="flex flex-wrap items-center gap-3">
            <span>案例概览</span>
            <StatusBadge status={proposalCase.status} />
          </CardTitle>
          <CardDescription className="text-slate-300">
            客户：{proposalCase.customerName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-slate-200">需求摘要</h3>
            <p className="whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-900/80 p-3 text-sm leading-6 text-slate-200">
              {proposalCase.requirementSummary?.trim() ||
                "尚未生成需求摘要，以下展示客户原始需求。"}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium text-slate-200">客户原始需求</h3>
            <p className="whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-900/80 p-3 text-sm leading-6 text-slate-300">
              {proposalCase.originalRequestText}
            </p>
          </section>
        </CardContent>
      </Card>
    </section>
  );
}
