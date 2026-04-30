"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CasesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CasesError({ error, reset }: CasesErrorProps) {
  return (
    <section className="space-y-6">
      <Card className="border-destructive/60 bg-card/80 text-foreground">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-rose-200">
            <AlertTriangle className="size-5" aria-hidden />
            案例页面加载失败
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            可能是数据库、网络或依赖异常，请检查环境后重试。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-md border border-border bg-muted/80 p-3 text-xs text-muted-foreground">
            {error.message || "未知错误，请稍后重试。"}
          </p>
          <Button
            type="button"
            onClick={reset}
          >
            <RefreshCw className="mr-2 size-4" aria-hidden />
            重新加载
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
