import type { ProposalStatus } from "@/lib/domain/proposal-status";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
  ProposalStatus,
  {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
    className?: string;
  }
> = {
  DRAFTING: {
    label: "草稿中",
    variant: "secondary" as const,
  },
  ANALYST_REVIEW: {
    label: "待分析确认",
    className: "border-amber-500/20 bg-amber-100 text-amber-600",
  },
  READY_TO_SEND: {
    label: "待发送客户",
    className: "border-sky-500/20 bg-sky-100 text-sky-600",
  },
  WAITING_CUSTOMER_FEEDBACK: {
    label: "等待客户反馈",
    className: "border-indigo-500/20 bg-indigo-100 text-indigo-600",
  },
  REVISION_NEEDED: {
    label: "需修订",
    className: "border-orange-500/20 bg-orange-100 text-orange-600",
  },
  ACCEPTED: {
    label: "客户已同意",
    className: "border-emerald-500/20 bg-emerald-100 text-emerald-600",
  },
  CANCELED: {
    label: "客户已取消",
    className: "border-rose-500/20 bg-rose-100 text-rose-600",
  },
};

type StatusBadgeProps = {
  status: ProposalStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant={config?.variant ?? "default"}
      className={
        config?.className ??
        ""
      }
    >
      {config?.label ?? String(status)}
    </Badge>
  );
}
