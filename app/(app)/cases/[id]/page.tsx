import { GenerationStatus, ProposalStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import {
  createRevisionFromFeedback,
  markAcceptedAction,
  markCanceledAction,
  sendCurrentRevision,
} from "@/app/(app)/cases/actions";
import { GenerationStatusPanel } from "@/components/generation-status-panel";
import { ProposalEditor } from "@/components/proposal-editor";
import { RevisionTimeline } from "@/components/revision-timeline";
import { SimilarCasesPanel } from "@/components/similar-cases-panel";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProposalCaseDetail } from "@/lib/db/proposal-repository";
import { canConfirmCurrentRevision } from "@/lib/domain/proposal-ui-state";
import { findSimilarAcceptedCasesSafely } from "@/lib/search/similar-cases";
import { RegenerateProposalButton } from "./regenerate-proposal-button";
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
    proposalCase.generationStatus === GenerationStatus.SUCCEEDED ||
    proposalCase.status !== ProposalStatus.DRAFTING ||
    proposalCase.revisions.length > 0;
  const similarCases = initialDraftWorkflowReady
    ? await findSimilarAcceptedCasesSafely({
        excludeCaseId: proposalCase.id,
        originalRequestText: proposalCase.originalRequestText,
        requirementSummary: proposalCase.requirementSummary,
      })
    : [];
  const canConfirmRevision = canConfirmCurrentRevision(proposalCase.status);
  const canSendCurrentRevision = proposalCase.status === ProposalStatus.READY_TO_SEND;
  const canProcessCustomerFeedback =
    proposalCase.status === ProposalStatus.WAITING_CUSTOMER_FEEDBACK;

  return (
    <section className="space-y-6">
      <header className="rounded-xl border border-slate-800/90 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-[0_24px_80px_-36px_rgba(34,211,238,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">
              Precision Proposal Desk
            </p>
            <TitleEditor
              proposalCaseId={proposalCase.id}
              initialTitle={proposalCase.title}
            />
            <p className="text-sm text-slate-300">
              客户：{proposalCase.customerName} · 当前轮次：第{" "}
              {proposalCase.currentRevisionNumber} 轮
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={proposalCase.status} />
            <RegenerateProposalButton
              proposalCaseId={proposalCase.id}
              disabled={
                proposalCase.status === ProposalStatus.ACCEPTED ||
                proposalCase.status === ProposalStatus.CANCELED
              }
            />
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr_1fr]">
        <Card className="border-slate-700 bg-slate-950/70 text-slate-100">
          <CardHeader>
            <CardTitle>客户上下文</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!initialDraftWorkflowReady ? (
              <GenerationStatusPanel
                proposalCaseId={proposalCase.id}
                generationStatus={proposalCase.generationStatus}
                generationError={proposalCase.generationError}
              />
            ) : null}

            <section className="space-y-2">
              <h2 className="text-sm font-medium text-slate-200">客户原始需求</h2>
              <p className="whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-900/70 p-3 text-sm leading-6 text-slate-300">
                {proposalCase.originalRequestText}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-medium text-slate-200">需求摘要</h2>
              <p className="whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-900/70 p-3 text-sm leading-6 text-slate-200">
                {proposalCase.requirementSummary?.trim() || "尚未生成需求摘要。"}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-medium text-slate-200">缺失信息</h2>
              <p className="whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-900/70 p-3 text-sm leading-6 text-slate-300">
                {proposalCase.missingInformation?.trim() || "当前未记录缺失信息。"}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-medium text-slate-200">最近客户反馈</h2>
              <p className="whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-900/70 p-3 text-sm leading-6 text-slate-300">
                {currentRevision?.customerFeedbackText?.trim() || "暂无客户反馈。"}
              </p>
            </section>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-950/70 text-slate-100">
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
                  currentRevision.analystConfirmedText?.trim() || currentRevision.aiDraft
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
                  className="border-slate-700 bg-slate-900/70 font-mono text-sm leading-6 text-slate-200"
                />
                <p className="text-xs text-slate-400">
                  当前方案已确认，下一步可在客户反馈操作中继续流转。
                </p>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
                {initialDraftWorkflowReady
                  ? "当前没有待确认的修订草稿。"
                  : "草稿尚未生成完成，生成结束后可在此编辑确认。"}
              </p>
            )}
          </CardContent>
        </Card>

        <SimilarCasesPanel cases={similarCases} />
      </div>

      {initialDraftWorkflowReady && currentRevision?.analystConfirmedText?.trim() ? (
        <Card className="border-slate-700 bg-slate-950/70 text-slate-100">
          <CardHeader>
            <CardTitle>PM 客户反馈操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canSendCurrentRevision ? (
              <form action={sendCurrentRevision} className="max-w-sm">
                <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
                <input type="hidden" name="revisionId" value={currentRevision.id} />
                <SubmitButton
                  idleText="标记已发送客户"
                  pendingText="提交中..."
                  className="w-full border border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800 disabled:opacity-70"
                />
              </form>
            ) : null}

            {canSendCurrentRevision ? (
              <p className="text-xs text-slate-400">
                已确认当前方案，可先标记“已发送客户”，再记录客户反馈结果。
              </p>
            ) : null}

            {canProcessCustomerFeedback ? (
              <>
                <p className="text-xs text-slate-400">
                  当前处于客户反馈阶段，可登记结果或基于反馈生成下一轮草稿。
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  <form action={markAcceptedAction}>
                    <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
                    <SubmitButton
                      idleText="客户已同意"
                      pendingText="提交中..."
                      className="w-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-70"
                    />
                  </form>

                  <form action={markCanceledAction}>
                    <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
                    <SubmitButton
                      idleText="客户已取消"
                      pendingText="提交中..."
                      className="w-full border border-rose-500/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25 disabled:opacity-70"
                    />
                  </form>
                </div>

                <form action={createRevisionFromFeedback} className="space-y-3">
                  <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
                  <div className="space-y-2">
                    <Label htmlFor="customer-feedback-text">客户反馈原文</Label>
                    <Textarea
                      id="customer-feedback-text"
                      name="customerFeedbackText"
                      rows={5}
                      required
                      placeholder="粘贴客户反馈、邮件回复或会议纪要关键意见。"
                      className="border-slate-700 bg-slate-900/90 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <SubmitButton
                      idleText="生成下一轮修订草稿"
                      pendingText="生成中..."
                      className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-70"
                    />
                  </div>
                </form>
              </>
            ) : (
              <p className="text-xs text-slate-400">
                当前状态暂不需要录入客户反馈，待流程进入反馈阶段后可继续操作。
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <RevisionTimeline revisions={[...proposalCase.revisions].reverse()} />
    </section>
  );
}
