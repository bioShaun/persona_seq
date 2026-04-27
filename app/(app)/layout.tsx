import Link from "next/link";
import { FlaskConical, FolderKanban, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(215_42%_18%),_hsl(224_36%_8%)_55%)] text-slate-100">
      <header className="border-b border-slate-700/70 bg-slate-950/65 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <FlaskConical className="size-3.5" aria-hidden />
              Precision Workflow Desk
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-slate-50">
              生信方案工作台
            </h1>
          </div>
          <nav aria-label="Primary" className="flex items-center gap-2">
            <Button asChild variant="secondary" className="border border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-800">
              <Link href="/cases">
                <FolderKanban className="mr-2 size-4" aria-hidden />
                案例列表
              </Link>
            </Button>
            <Button asChild className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
              <Link href="/cases/new">
                <PlusSquare className="mr-2 size-4" aria-hidden />
                新建案例
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
