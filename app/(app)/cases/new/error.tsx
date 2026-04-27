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
      <Card className="border-rose-800/60 bg-slate-950/80 text-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-200">
            <AlertTriangle className="size-5" aria-hidden />
            生成草稿失败
          </CardTitle>
          <CardDescription className="text-slate-300">
            请检查表单内容和系统配置后重试。如果持续失败，可先返回案例列表确认环境状态。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-md border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-400">
            {error.message || "未知错误"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={reset}
              className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            >
              <RefreshCw className="mr-2 size-4" aria-hidden />
              重试
            </Button>
            <Button
              asChild
              type="button"
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            >
              <Link href="/cases">返回工作台</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
