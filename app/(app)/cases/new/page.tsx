import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createCaseAndGenerateDraft } from "@/app/(app)/cases/actions";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewCasePage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-50">
            新建方案案例
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            粘贴客户聊天记录、邮件原文或会议摘录，系统将自动创建案例并生成首版草稿。
          </p>
        </div>
        <Button asChild variant="outline" className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800">
          <Link href="/cases">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            返回工作台
          </Link>
        </Button>
      </div>

      <Card className="border-slate-700 bg-slate-950/70 text-slate-100">
        <CardHeader>
          <CardTitle>案例信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCaseAndGenerateDraft} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">项目标题</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="例如：肿瘤 panel 检测方案咨询"
                  className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">客户名称</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  required
                  placeholder="例如：华东某三甲医院检验科"
                  className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="analystUserId">分析师 ID（可选）</Label>
              <Input
                id="analystUserId"
                name="analystUserId"
                placeholder="若已确定负责人可填写，留空则后续分配"
                className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalRequestText">客户原始需求</Label>
              <Textarea
                id="originalRequestText"
                name="originalRequestText"
                required
                rows={12}
                placeholder="粘贴客户聊天/邮件全文：目标样本类型、检测目的、预算、交付时限、特殊限制等。"
                className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">
                建议保留原始措辞和上下文，便于 AI 草稿提取真实约束并减少来回确认。
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <SubmitButton
                idleText="创建案例"
                pendingText="创建中..."
                className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
