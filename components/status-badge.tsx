import { type ProposalStatus } from "@prisma/client";
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
    className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  },
  READY_TO_SEND: {
    label: "待发送客户",
    className: "border-sky-500/20 bg-sky-500/10 text-sky-400",
  },
  WAITING_CUSTOMER_FEEDBACK: {
    label: "等待客户反馈",
    className: "border-indigo-500/20 bg-indigo-500/10 text-indigo-400",
  },
  REVISION_NEEDED: {
    label: "需修订",
    className: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  },
  ACCEPTED: {
    label: "客户已同意",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  },
  CANCELED: {
    label: "客户已取消",
    className: "border-rose-500/20 bg-rose-500/10 text-rose-400",
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
