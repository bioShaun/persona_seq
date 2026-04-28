import { type ProposalStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
  ProposalStatus,
  {
    label: string;
    className: string;
  }
> = {
  DRAFTING: {
    label: "草稿中",
    className:
      "border-slate-600 bg-slate-800/90 text-slate-200 ring-1 ring-inset ring-slate-500/40",
  },
  ANALYST_REVIEW: {
    label: "待分析确认",
    className:
      "border-amber-500/50 bg-amber-500/15 text-amber-200 ring-1 ring-inset ring-amber-500/30",
  },
  READY_TO_SEND: {
    label: "待发送客户",
    className:
      "border-sky-500/50 bg-sky-500/15 text-sky-200 ring-1 ring-inset ring-sky-500/30",
  },
  WAITING_CUSTOMER_FEEDBACK: {
    label: "等待客户反馈",
    className:
      "border-indigo-500/50 bg-indigo-500/15 text-indigo-200 ring-1 ring-inset ring-indigo-500/30",
  },
  REVISION_NEEDED: {
    label: "需修订",
    className:
      "border-orange-500/50 bg-orange-500/15 text-orange-200 ring-1 ring-inset ring-orange-500/30",
  },
  ACCEPTED: {
    label: "客户已同意",
    className:
      "border-emerald-500/50 bg-emerald-500/15 text-emerald-200 ring-1 ring-inset ring-emerald-500/30",
  },
  CANCELED: {
    label: "客户已取消",
    className:
      "border-rose-500/50 bg-rose-500/15 text-rose-200 ring-1 ring-inset ring-rose-500/30",
  },
};

type StatusBadgeProps = {
  status: ProposalStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      className={
        config?.className ??
        "border-slate-600 bg-slate-800/90 text-slate-200 ring-1 ring-inset ring-slate-500/40"
      }
    >
      {config?.label ?? String(status)}
    </Badge>
  );
}
