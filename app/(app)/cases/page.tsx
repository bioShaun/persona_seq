import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { listProposalCases } from "@/lib/db/proposal-repository";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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
          <h2 className="text-2xl font-semibold tracking-tight text-slate-50">
            PM 工作台
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            管理客户需求与方案推进进度，快速定位当前轮次状态并进入案例详情继续处理。
          </p>
        </div>
        <Button asChild className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
          <Link href="/cases/new">
            <Plus className="mr-2 size-4" aria-hidden />
            新建案例
          </Link>
        </Button>
      </header>

      <Card className="border-slate-700 bg-slate-950/70 text-slate-100">
        <CardHeader>
          <CardTitle>案例列表</CardTitle>
          <CardDescription className="text-slate-400">
            按更新时间倒序展示，优先处理最新进展。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
              <p className="text-sm text-slate-300">还没有案例，先创建第一个项目。</p>
              <Button asChild variant="outline" className="mt-4 border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800">
                <Link href="/cases/new">去新建</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableCaption className="sr-only">
                案例列表，按更新时间倒序展示。每一行包含项目名、客户、状态、当前轮次与进入详情的操作入口。
              </TableCaption>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-300">项目</TableHead>
                  <TableHead className="text-slate-300">客户</TableHead>
                  <TableHead className="text-slate-300">状态</TableHead>
                  <TableHead className="text-slate-300">当前轮次</TableHead>
                  <TableHead className="text-slate-300">更新</TableHead>
                  <TableHead className="text-right text-slate-300">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((proposalCase) => (
                  <TableRow key={proposalCase.id} className="border-slate-800 hover:bg-slate-900/70">
                    <TableCell className="font-medium text-slate-100">
                      {proposalCase.title}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {proposalCase.customerName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={proposalCase.status} />
                    </TableCell>
                    <TableCell className="text-slate-300">
                      第 {proposalCase.currentRevisionNumber} 轮
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {formatDate(proposalCase.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="secondary" className="border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800">
                        <Link href={`/cases/${proposalCase.id}`}>
                          打开
                          <ArrowRight className="ml-1.5 size-3.5" aria-hidden />
                        </Link>
                      </Button>
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
