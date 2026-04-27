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
    className: "border-slate-300/80 bg-slate-100 text-slate-700",
  },
  ANALYST_REVIEW: {
    label: "待分析确认",
    className: "border-amber-300/80 bg-amber-50 text-amber-700",
  },
  READY_TO_SEND: {
    label: "待发送客户",
    className: "border-sky-300/80 bg-sky-50 text-sky-700",
  },
  WAITING_CUSTOMER_FEEDBACK: {
    label: "等待客户反馈",
    className: "border-indigo-300/80 bg-indigo-50 text-indigo-700",
  },
  REVISION_NEEDED: {
    label: "需修订",
    className: "border-orange-300/80 bg-orange-50 text-orange-700",
  },
  ACCEPTED: {
    label: "客户已同意",
    className: "border-emerald-300/80 bg-emerald-50 text-emerald-700",
  },
  CANCELED: {
    label: "客户已取消",
    className: "border-rose-300/80 bg-rose-50 text-rose-700",
  },
};

type StatusBadgeProps = {
  status: ProposalStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return <Badge className={config.className}>{config.label}</Badge>;
}
