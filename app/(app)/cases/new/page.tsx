import { createCaseAndGenerateDraft } from "@/app/(app)/cases/actions";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewCasePage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          新建方案案例
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          粘贴客户聊天记录、邮件原文或会议摘录，系统将自动创建案例并生成首版草稿。
        </p>
      </header>

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="font-heading">案例信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCaseAndGenerateDraft} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    项目标题{" "}
                     <span className="text-xs text-muted-foreground">（选填，留空让 AI 自动生成）</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="留空让 AI 自动生成，或手动填写"
                    className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
                  />
                </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">客户名称</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  required
                  placeholder="例如：华东某三甲医院检验科"
                  className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="analystUserId">分析师 ID（可选）</Label>
              <Input
                id="analystUserId"
                name="analystUserId"
                placeholder="若已确定负责人可填写，留空则后续分配"
                className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
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
                className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
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
