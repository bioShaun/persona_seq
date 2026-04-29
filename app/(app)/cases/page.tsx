import { listProposalCases } from "@/lib/db/proposal-repository";
import { CasesList } from "./cases-list";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export default async function CasesPage() {
  const cases = await listProposalCases();

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          案例列表
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          管理客户需求与方案推进进度，快速定位当前轮次状态并进入案例详情继续处理。
        </p>
      </header>

      <CasesList
        cases={cases.map((c) => ({
          id: c.id,
          title: c.title,
          customerName: c.customerName,
          status: c.status,
          currentRevisionNumber: c.currentRevisionNumber,
          updatedAt: formatDate(c.updatedAt),
        }))}
      />
    </section>
  );
}
