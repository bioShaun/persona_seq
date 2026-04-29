"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, PlusSquare } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/cases",
    label: "案例列表",
    icon: FolderKanban,
    activeClassName:
      "border border-border bg-muted text-foreground hover:bg-secondary",
    inactiveClassName:
      "border border-border bg-card/70 text-secondary-foreground hover:bg-muted",
    variant: "secondary" as const,
  },
  {
    href: "/cases/new",
    label: "新建案例",
    icon: PlusSquare,
    activeClassName:
      "bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-500/30 hover:bg-cyan-300",
    inactiveClassName: "bg-cyan-500 text-slate-950 hover:bg-cyan-400",
    variant: "default" as const,
  },
];

export function AppNav() {
  const pathname = usePathname();
  const isNewCaseRoute = pathname?.startsWith("/cases/new") ?? false;
  const isCaseDetailRoute =
    pathname?.startsWith("/cases/") && !isNewCaseRoute ? true : false;

  return (
    <nav aria-label="Primary" className="flex items-center gap-2">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/cases"
            ? pathname === "/cases" || isCaseDetailRoute
            : isNewCaseRoute;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: item.variant }),
              isActive ? item.activeClassName : item.inactiveClassName,
            )}
          >
            <Icon className="mr-2 size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
