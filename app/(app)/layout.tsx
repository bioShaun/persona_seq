import { FlaskConical } from "lucide-react";
import { AppNav } from "@/components/app-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(215_42%_18%),_hsl(224_36%_8%)_55%)] text-foreground">
      <header className="border-b border-border bg-background/65 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <FlaskConical className="size-3.5" aria-hidden />
              Precision Workflow Desk
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-foreground">
              生信方案工作台
            </h1>
          </div>
          <AppNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
