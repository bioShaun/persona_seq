"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import type { ProposalStatus } from "@/lib/domain/proposal-status";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

function filterCases(cases: CaseItem[], filter: string) {
  if (filter === "all") return cases;
  if (filter === "drafting")
    return cases.filter((c) => c.status === "DRAFTING");
  if (filter === "in_progress")
    return cases.filter((c) => IN_PROGRESS_STATUSES.includes(c.status));
  if (filter === "completed")
    return cases.filter((c) => COMPLETED_STATUSES.includes(c.status));
  return cases;
}

export function CasesList({ cases }: { cases: CaseItem[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const filtered = filterCases(cases, activeFilter);

  return (
    <div className="space-y-4">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="group block outline-none"
            >
              <Card className="border border-transparent hover:-translate-y-0.5 hover:border-border/40 transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-base leading-snug">
                    {c.title}
                  </CardTitle>
                  <CardDescription>{c.customerName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatusBadge status={c.status} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>第 {c.currentRevisionNumber} 轮</span>
                    <span>{c.updatedAt}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
