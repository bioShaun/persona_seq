import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CasesLoading() {
  return (
    <section className="space-y-6" aria-busy="true" aria-live="polite">
      <header className="space-y-2">
        <Skeleton className="h-8 w-40 bg-slate-800" />
        <Skeleton className="h-4 w-80 max-w-full bg-slate-800" />
      </header>

      <Card className="border-slate-700 bg-slate-950/70 text-slate-100">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-24 bg-slate-800" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64 bg-slate-800" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full bg-slate-800" />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
