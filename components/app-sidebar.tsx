"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/cases",
    label: "案例列表",
    icon: LayoutGrid,
  },
  {
    href: "/cases/new",
    label: "新建案例",
    icon: Plus,
  },
  {
    href: "#",
    label: "设置",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isNewCaseRoute = pathname?.startsWith("/cases/new") ?? false;
  const isCaseDetailRoute =
    pathname?.startsWith("/cases/") && !isNewCaseRoute ? true : false;

  return (
    <aside
      className={cn(
        "group fixed left-0 top-0 z-40 flex h-screen flex-col",
        "w-12 hover:w-40",
        "border-r border-sidebar-border bg-sidebar",
        "transition-all duration-200 ease-out",
        "overflow-hidden"
      )}
    >
      <div className="flex h-12 shrink-0 items-center justify-center border-b border-sidebar-border">
        <span className="text-sm font-bold tracking-wider text-sidebar-foreground">
          PS
        </span>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/cases"
              ? pathname === "/cases" || isCaseDetailRoute
              : item.href === "/cases/new"
                ? isNewCaseRoute
                : false;

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2",
                "transition-all duration-200 ease-out",
                isActive
                  ? "border-l-2 border-primary text-sidebar-foreground"
                  : "border-l-2 border-transparent text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="whitespace-nowrap text-sm opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
