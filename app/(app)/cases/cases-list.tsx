"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderOpen, Search } from "lucide-react";
import type { ProposalStatus } from "@/lib/domain/proposal-status";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CaseItem = {
  id: string;
  title: string;
  customerName: string;
  status: ProposalStatus;
  currentRevisionNumber: number;
  updatedAt: string;
};

const TABS = [
  { label: "全部", value: "all" },
  { label: "草稿中", value: "drafting" },
  { label: "进行中", value: "in_progress" },
  { label: "已完成", value: "completed" },
] as const;

const IN_PROGRESS_STATUSES: ProposalStatus[] = [
  "ANALYST_REVIEW",
  "READY_TO_SEND",
  "WAITING_CUSTOMER_FEEDBACK",
  "REVISION_NEEDED",
];

const COMPLETED_STATUSES: ProposalStatus[] = ["ACCEPTED", "CANCELED"];

function filterCases(cases: CaseItem[], filter: string, search: string) {
  let result = cases;
  if (filter === "drafting")
    result = result.filter((c) => c.status === "DRAFTING");
  else if (filter === "in_progress")
    result = result.filter((c) => IN_PROGRESS_STATUSES.includes(c.status));
  else if (filter === "completed")
    result = result.filter((c) => COMPLETED_STATUSES.includes(c.status));

  const q = search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q)
    );
  }
  return result;
}

export function CasesList({ cases }: { cases: CaseItem[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const filtered = filterCases(cases, activeFilter, search);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索案例名称或客户…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-lg px-3 h-8 text-sm font-medium transition-all",
              activeFilter === tab.value
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/60 py-16 text-center">
          <FolderOpen className="mb-3 size-8 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">暂无案例</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>案例标题</TableHead>
              <TableHead>客户名称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>轮次</TableHead>
              <TableHead>更新时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <TableCell>
                  <Link href={`/cases/${c.id}`} className="block">
                    {c.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/cases/${c.id}`} className="block">
                    {c.customerName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/cases/${c.id}`} className="block">
                    <StatusBadge status={c.status} />
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/cases/${c.id}`} className="block">
                    第 {c.currentRevisionNumber} 轮
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/cases/${c.id}`} className="block">
                    {c.updatedAt}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
