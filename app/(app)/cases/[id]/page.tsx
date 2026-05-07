import { notFound } from "next/navigation";
import {
  createRevisionFromFeedback,
  enterCustomerFeedbackAction,
  generateRevisionFromFeedbackAction,
  markAcceptedAction,
  markCanceledAction,
  sendCurrentRevision,
} from "@/app/(app)/cases/actions";
import { GenerationStatusPanel } from "@/components/generation-status-panel";
import { ProposalEditor } from "@/components/proposal-editor";
import { RevisionTimeline } from "@/components/revision-timeline";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProposalCaseDetail, getCaseEmbedding } from "@/lib/db/proposal-repository";
import {
  canConfirmCurrentRevision,
  canSendCurrentRevision,
  canProcessCustomerFeedback,
  isRevisionNeeded,
  isEditableCase,
} from "@/lib/domain/proposal-ui-state";
import { findSimilarCasesV2Safely } from "@/lib/search/similar-cases";
import { getCurrentUser } from "@/lib/auth/current-user";
import { RegenerateProposalButton } from "./regenerate-proposal-button";
import { SimilarCasesDrawer } from "./similar-cases-drawer";
import { TagEditor } from "./tag-editor";
import { TitleEditor } from "./title-editor";

export const dynamic = "force-dynamic";

type CaseDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params;
  const proposalCase = await getProposalCaseDetail(id);

  if (!proposalCase) {
    notFound();
  }

  const currentRevision =
    proposalCase.revisions.find(
      (revision) => revision.revisionNumber === proposalCase.currentRevisionNumber,
    ) ?? proposalCase.revisions.at(-1);

  const initialDraftWorkflowReady =
    proposalCase.generationStatus === "SUCCEEDED" ||
    proposalCase.status !== "DRAFTING" ||
    proposalCase.revisions.length > 0;

  const queryEmbedding = initialDraftWorkflowReady
    ? await getCaseEmbedding(proposalCase.id)
    : null;

  const { results: similarCases } = initialDraftWorkflowReady
    ? await findSimilarCasesV2Safely({
        excludeCaseId: proposalCase.id,
        queryEmbedding,
        queryTags: {
          organism: proposalCase.organism,
          productLine: proposalCase.productLine,
          customerName: proposalCase.customerName,
          application: proposalCase.application,
          keywordTags: proposalCase.keywordTags,
          analysisDepth: proposalCase.analysisDepth,
          sampleTypes: proposalCase.sampleTypes,
        },
        originalRequestText: proposalCase.originalRequestText,
        requirementSummary: proposalCase.requirementSummary,
      })
    : { results: [] };
  const canConfirmRevision = canConfirmCurrentRevision(proposalCase.status);
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser.role === "ADMIN";

  return (
    <section className="flex gap-6">
      <aside className="w-80 shrink-0 space-y-6 self-start sticky top-6">
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Case Overview
          </p>
          <TitleEditor
            proposalCaseId={proposalCase.id}
            initialTitle={proposalCase.title}
          />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>客户：{proposalCase.customerName}</p>
            <p>当前轮次：第 {proposalCase.currentRevisionNumber} 轮</p>
          </div>
          <StatusBadge status={proposalCase.status} />
          <RegenerateProposalButton
            proposalCaseId={proposalCase.id}
            disabled={
              !isEditableCase(proposalCase.status)
            }
          />
        </div>

        <TagEditor
          proposalCaseId={proposalCase.id}
          tags={{
            productLine: proposalCase.productLine,
            organism: proposalCase.organism,
            application: proposalCase.application,
            analysisDepth: proposalCase.analysisDepth,
            sampleTypes: proposalCase.sampleTypes,
            platforms: proposalCase.platforms,
            keywordTags: proposalCase.keywordTags,
          }}
          isAdmin={isAdmin}
          isEditable={isEditableCase(proposalCase.status)}
        />

        <div className="space-y-3">
          {canConfirmRevision ? (
            <a
              href="#proposal-editor"
              className={cn(buttonVariants({ variant: "default" }), "w-full")}
            >
              确认方案
            </a>
          ) : null}

          {canSendCurrentRevision(proposalCase.status) && currentRevision ? (
            <form action={sendCurrentRevision} className="w-full">
              <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
              <input type="hidden" name="revisionId" value={currentRevision.id} />
              <SubmitButton
                idleText="发送客户"
                pendingText="提交中..."
                className="w-full"
              />
            </form>
          ) : null}

          {canProcessCustomerFeedback(proposalCase.status) ? (
            <a
              href="#customer-feedback"
              className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
            >
              登记反馈
            </a>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <Card className="border-border bg-card text-card-foreground" id="customer-context">
          <details className="group" open>
            <summary className="list-none cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>客户上下文</CardTitle>
                <span className="text-xs text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                  ▼
                </span>
              </CardHeader>
            </summary>
            <CardContent className="space-y-4">
              {!initialDraftWorkflowReady ? (
                <GenerationStatusPanel
                  proposalCaseId={proposalCase.id}
                  generationStatus={proposalCase.generationStatus}
                  generationError={proposalCase.generationError}
                />
              ) : null}

              <section className="space-y-2">
                <h2 className="text-sm font-medium text-foreground/80">
                  客户原始需求
                </h2>
                <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/70 p-3 text-sm leading-6 text-muted-foreground">
                  {proposalCase.originalRequestText}
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-sm font-medium text-foreground/80">
                  需求摘要
                </h2>
                <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/70 p-3 text-sm leading-6 text-foreground/80">
                  {proposalCase.requirementSummary?.trim() || "尚未生成需求摘要。"}
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-sm font-medium text-foreground/80">
                  缺失信息
                </h2>
                <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/70 p-3 text-sm leading-6 text-muted-foreground">
                  {proposalCase.missingInformation?.trim() || "当前未记录缺失信息。"}
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-sm font-medium text-foreground/80">
                  最近客户反馈
                </h2>
                <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/70 p-3 text-sm leading-6 text-muted-foreground">
                  {currentRevision?.customerFeedbackText?.trim() || "暂无客户反馈。"}
                </p>
              </section>
            </CardContent>
          </details>
        </Card>

        <Card className="border-border bg-card text-card-foreground" id="proposal-editor">
          <CardHeader>
            <CardTitle>分析师方案确认</CardTitle>
          </CardHeader>
          <CardContent>
            {canConfirmRevision && currentRevision ? (
              <ProposalEditor
                key={currentRevision.id}
                proposalCaseId={proposalCase.id}
                revisionId={currentRevision.id}
                initialText={
                  currentRevision.analystConfirmedText?.trim() ||
                  currentRevision.aiDraft ||
                  ""
                }
              />
            ) : initialDraftWorkflowReady &&
              currentRevision?.analystConfirmedText?.trim() ? (
              <div className="space-y-2">
                <Label htmlFor="confirmed-proposal-text">已确认方案</Label>
                <Textarea
                  id="confirmed-proposal-text"
                  rows={18}
                  readOnly
                  value={currentRevision.analystConfirmedText}
                  className="border-border bg-muted/70 font-mono text-sm leading-6 text-foreground/80"
                />
                <p className="text-xs text-muted-foreground">
                  当前方案已确认，下一步可在客户反馈操作中继续流转。
                </p>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border bg-muted/60 p-4 text-sm text-muted-foreground">
                {initialDraftWorkflowReady
                  ? "当前没有待确认的修订草稿。"
                  : "草稿尚未生成完成，生成结束后可在此编辑确认。"}
              </p>
            )}
          </CardContent>
        </Card>

        {initialDraftWorkflowReady && currentRevision?.analystConfirmedText?.trim() ? (
          <Card className="border-border bg-card text-card-foreground" id="customer-feedback">
            <CardHeader>
              <CardTitle>PM 客户反馈操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canSendCurrentRevision(proposalCase.status) ? (
                <form action={sendCurrentRevision} className="max-w-sm">
                  <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
                  <input type="hidden" name="revisionId" value={currentRevision.id} />
                  <SubmitButton
                    idleText="标记已发送客户"
                    pendingText="提交中..."
                    variant="outline"
                    className="w-full"
                  />
                </form>
              ) : null}

              {canSendCurrentRevision(proposalCase.status) ? (
                <p className="text-xs text-muted-foreground">
                  已确认当前方案，可先标记“已发送客户”，再记录客户反馈结果。
                </p>
              ) : null}

              {canProcessCustomerFeedback(proposalCase.status) ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    当前处于客户反馈阶段，可登记结果或基于反馈生成下一轮草稿。
                  </p>

                  <div className="grid gap-3 md:grid-cols-2">
                    <form action={markAcceptedAction}>
                      <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
                      <SubmitButton
                        idleText="客户已同意"
                        pendingText="提交中..."
                        className="w-full"
                      />
                    </form>

                    <form action={markCanceledAction}>
                      <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
                      <SubmitButton
                        idleText="客户已取消"
                        pendingText="提交中..."
                        variant="destructive"
                        className="w-full"
                      />
                    </form>
                  </div>

                  <form action={enterCustomerFeedbackAction} className="space-y-3">
                    <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
                    <div className="space-y-2">
                      <Label htmlFor="customer-feedback-text">客户反馈原文</Label>
                      <Textarea
                        id="customer-feedback-text"
                        name="customerFeedbackText"
                        rows={5}
                        required
                        placeholder="粘贴客户反馈、邮件回复或会议纪要关键意见。"
                        className="border-border bg-muted/90 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex justify-end">
                      <SubmitButton
                        idleText="登记反馈并进入修订"
                        pendingText="提交中..."
                      />
                    </div>
                  </form>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  当前状态暂不需要录入客户反馈，待流程进入反馈阶段后可继续操作。
                </p>
              )}
            </CardContent>
          </Card>
        ) : null}

        {isRevisionNeeded(proposalCase.status) ? (
          <Card className="border-border bg-card text-card-foreground" id="revision-needed">
            <CardHeader>
              <CardTitle>客户反馈已登记，等待生成修订草案</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                当前处于「修订待处理」状态。客户反馈已记录，请触发生成修订草案。
              </p>
              <form action={generateRevisionFromFeedbackAction}>
                <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
                <SubmitButton
                  idleText="生成修订草案"
                  pendingText="生成中..."
                  className="w-full"
                />
              </form>
            </CardContent>
          </Card>
        ) : null}

        <RevisionTimeline revisions={[...proposalCase.revisions].reverse()} />
      </div>

      <SimilarCasesDrawer cases={similarCases} caseId={proposalCase.id} />
    </section>
  );
}
