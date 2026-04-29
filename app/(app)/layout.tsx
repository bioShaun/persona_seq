import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 pl-12">
        <div className="px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
