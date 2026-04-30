"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type NewCaseErrorProps = {
  error: Error;
  reset: () => void;
};

export default function NewCaseError({ error, reset }: NewCaseErrorProps) {
  return (
    <section className="space-y-6">
      <Card className="border-destructive/60 bg-card/80 text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-200">
            <AlertTriangle className="size-5" aria-hidden />
            生成草稿失败
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            请检查表单内容和系统配置后重试。如果持续失败，可先返回案例列表确认环境状态。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-md border border-border bg-muted/80 p-3 text-xs text-muted-foreground">
            {error.message || "未知错误"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={reset}
            >
              <RefreshCw className="mr-2 size-4" aria-hidden />
              重试
            </Button>
            <Link
              href="/cases"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-all border-border bg-background hover:bg-muted hover:text-foreground"
            >
              返回工作台
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
