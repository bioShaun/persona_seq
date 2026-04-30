"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FolderOpen, Search } from "lucide-react";
import type { ProposalStatus } from "@/lib/domain/proposal-status";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  organism: string | null;
  productLine: string | null;
  application: string | null;
  analysisDepth: string | null;
  keywordTags: string[];
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

function getFilterCounts(cases: CaseItem[]) {
  const organisms = new Map<string, number>();
  const productLines = new Map<string, number>();
  const applications = new Map<string, number>();

  for (const c of cases) {
    if (c.organism) organisms.set(c.organism, (organisms.get(c.organism) ?? 0) + 1);
    if (c.productLine) productLines.set(c.productLine, (productLines.get(c.productLine) ?? 0) + 1);
    if (c.application) applications.set(c.application, (applications.get(c.application) ?? 0) + 1);
  }

  return { organisms, productLines, applications };
}

function FilterSidebar({
  counts,
  selected,
  onToggle,
}: {
  counts: {
    organisms: Map<string, number>;
    productLines: Map<string, number>;
    applications: Map<string, number>;
  };
  selected: { organisms: Set<string>; productLines: Set<string>; applications: Set<string> };
  onToggle: (dimension: "organisms" | "productLines" | "applications", value: string) => void;
}) {
  const sections = [
    { key: "organisms" as const, label: "物种", items: counts.organisms },
    { key: "productLines" as const, label: "业务类型", items: counts.productLines },
    { key: "applications" as const, label: "应用场景", items: counts.applications },
  ];

  return (
    <div className="w-48 shrink-0 space-y-4">
      {sections.map(({ key, label, items }) => (
        <div key={key} className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {[...items.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => (
            <button
              key={value}
              onClick={() => onToggle(key, value)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-1 text-xs transition-colors",
                selected[key].has(value)
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span>{value}</span>
              <span className="text-muted-foreground/70">{count}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function filterCases(
  cases: CaseItem[],
  statusFilter: string,
  search: string,
  selected: { organisms: Set<string>; productLines: Set<string>; applications: Set<string> },
) {
  let result = cases;

  if (statusFilter === "drafting")
    result = result.filter((c) => c.status === "DRAFTING");
  else if (statusFilter === "in_progress")
    result = result.filter((c) => IN_PROGRESS_STATUSES.includes(c.status));
  else if (statusFilter === "completed")
    result = result.filter((c) => COMPLETED_STATUSES.includes(c.status));

  if (selected.organisms.size > 0)
    result = result.filter((c) => c.organism && selected.organisms.has(c.organism));
  if (selected.productLines.size > 0)
    result = result.filter((c) => c.productLine && selected.productLines.has(c.productLine));
  if (selected.applications.size > 0)
    result = result.filter((c) => c.application && selected.applications.has(c.application));

  const q = search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q),
    );
  }
  return result;
}

export function CasesList({ cases }: { cases: CaseItem[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({
    organisms: new Set<string>(),
    productLines: new Set<string>(),
    applications: new Set<string>(),
  });

  const counts = useMemo(() => getFilterCounts(cases), [cases]);

  const toggleFilter = (dimension: "organisms" | "productLines" | "applications", value: string) => {
    setSelected((prev) => {
      const next = { ...prev, [dimension]: new Set(prev[dimension]) };
      if (next[dimension].has(value)) {
        next[dimension].delete(value);
      } else {
        next[dimension].add(value);
      }
      return next;
    });
  };

  const filtered = filterCases(cases, activeFilter, search, selected);

  return (
    <div className="flex gap-6">
      <FilterSidebar counts={counts} selected={selected} onToggle={toggleFilter} />

      <div className="min-w-0 flex-1 space-y-4">
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
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
                <TableHead>标签</TableHead>
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
                    <Link href={`/cases/${c.id}`} className="flex flex-wrap gap-1">
                      {c.organism ? (
                        <Badge variant="default" className="text-xs bg-primary/20 text-primary hover:bg-primary/30">
                          {c.organism}
                        </Badge>
                      ) : null}
                      {c.productLine ? (
                        <Badge variant="default" className="text-xs bg-secondary/80 text-secondary-foreground hover:bg-secondary">
                          {c.productLine}
                        </Badge>
                      ) : null}
                      {c.application ? (
                        <Badge variant="outline" className="text-xs">
                          {c.application}
                        </Badge>
                      ) : null}
                      {c.keywordTags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs text-muted-foreground">
                          {tag}
                        </Badge>
                      ))}
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
    </div>
  );
}
