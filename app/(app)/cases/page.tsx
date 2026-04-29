import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { listProposalCases } from "@/lib/db/proposal-repository";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            PM 工作台
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            管理客户需求与方案推进进度，快速定位当前轮次状态并进入案例详情继续处理。
          </p>
        </div>
        <Link
          href="/cases/new"
          className="group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 h-8 text-sm font-medium whitespace-nowrap bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all"
        >
          <Plus className="mr-2 size-4" aria-hidden />
          新建案例
        </Link>
      </header>

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>案例列表</CardTitle>
          <CardDescription className="text-muted-foreground">
            按更新时间倒序展示，优先处理最新进展。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/60 p-8 text-center">
              <p className="text-sm text-muted-foreground">还没有案例，先创建第一个项目。</p>
              <Link
                href="/cases/new"
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-all border-border bg-background hover:bg-muted hover:text-foreground mt-4"
              >
                去新建
              </Link>
            </div>
          ) : (
            <Table>
              <TableCaption className="sr-only">
                案例列表，按更新时间倒序展示。每一行包含项目名、客户、状态、当前轮次与进入详情的操作入口。
              </TableCaption>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">项目</TableHead>
                  <TableHead className="text-muted-foreground">客户</TableHead>
                  <TableHead className="text-muted-foreground">状态</TableHead>
                  <TableHead className="text-muted-foreground">当前轮次</TableHead>
                  <TableHead className="text-muted-foreground">更新</TableHead>
                  <TableHead className="text-right text-muted-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((proposalCase) => (
                  <TableRow key={proposalCase.id} className="border-border hover:bg-muted">
                    <TableCell className="font-medium text-card-foreground">
                      {proposalCase.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {proposalCase.customerName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={proposalCase.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      第 {proposalCase.currentRevisionNumber} 轮
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(proposalCase.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/cases/${proposalCase.id}`}
                        className="inline-flex h-7 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      >
                        打开
                        <ArrowRight className="ml-1.5 size-3.5" aria-hidden />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
