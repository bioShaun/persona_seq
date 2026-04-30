"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Pencil, RefreshCcw, X } from "lucide-react";
import { updateCaseTags, reExtractCaseTagsAction } from "@/app/(app)/cases/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PRODUCT_LINES,
  ORGANISMS,
  APPLICATIONS,
  ANALYSIS_DEPTHS,
  SAMPLE_TYPES,
  PLATFORMS,
} from "@/lib/domain/case-tags";

type TagEditorProps = {
  proposalCaseId: string;
  tags: {
    productLine: string | null;
    organism: string | null;
    application: string | null;
    analysisDepth: string | null;
    sampleTypes: string[];
    platforms: string[];
    keywordTags: string[];
  };
  isAdmin: boolean;
  isEditable: boolean;
};

const SINGLE_SELECT_DIMENSIONS: {
  key: keyof Pick<TagEditorProps["tags"], "productLine" | "organism" | "application" | "analysisDepth">;
  label: string;
  options: readonly string[];
}[] = [
  { key: "productLine", label: "业务类型", options: PRODUCT_LINES },
  { key: "organism", label: "物种", options: ORGANISMS },
  { key: "application", label: "应用场景", options: APPLICATIONS },
  { key: "analysisDepth", label: "分析深度", options: ANALYSIS_DEPTHS },
];

const MULTI_SELECT_DIMENSIONS: {
  key: keyof Pick<TagEditorProps["tags"], "sampleTypes" | "platforms">;
  label: string;
  options: readonly string[];
}[] = [
  { key: "sampleTypes", label: "样本类型", options: SAMPLE_TYPES },
  { key: "platforms", label: "测序平台", options: PLATFORMS },
];

export function TagEditor({ proposalCaseId, tags, isAdmin, isEditable }: TagEditorProps) {
  const router = useRouter();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | string[]>("");
  const [isPending, startTransition] = useTransition();
  const [reExtracting, setReExtracting] = useState(false);

  const handleEdit = (key: string, current: string | string[] | null) => {
    setEditingKey(key);
    setDraft(current ?? (Array.isArray(current) ? [] : ""));
  };

  const handleSave = (key: string) => {
    const formData = new FormData();
    formData.set("proposalCaseId", proposalCaseId);
    const value = Array.isArray(draft) ? draft.join(",") : draft;
    formData.set(key, value);

    startTransition(async () => {
      await updateCaseTags(formData);
      setEditingKey(null);
      router.refresh();
    });
  };

  const handleCancel = () => {
    setEditingKey(null);
    setDraft("");
  };

  const handleReExtract = async () => {
    setReExtracting(true);
    try {
      const formData = new FormData();
      formData.set("proposalCaseId", proposalCaseId);
      await reExtractCaseTagsAction(formData);
    } catch (e) {
      console.error("Re-extract failed:", e);
    } finally {
      setReExtracting(false);
      router.refresh();
    }
  };

  const toggleMultiSelect = (option: string) => {
    setDraft((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.includes(option) ? arr.filter((v) => v !== option) : [...arr, option];
    });
  };

  const renderSingleSelect = (key: string, label: string, options: readonly string[], value: string | null) => {
    if (editingKey === key) {
      return (
        <div className="space-y-1" key={key}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <select
            value={draft as string}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="">未设置</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <button
              onClick={() => handleSave(key)}
              disabled={isPending}
              className="rounded p-1 text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between" key={key}>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm">{value || "未设置"}</p>
        </div>
        {isEditable && (
          <button
            onClick={() => handleEdit(key, value)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>
    );
  };

  const renderMultiSelect = (key: string, label: string, options: readonly string[], value: string[]) => {
    if (editingKey === key) {
      return (
        <div className="space-y-1" key={key}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex flex-wrap gap-1">
            {options.map((opt) => (
              <Badge
                key={opt}
                variant={(draft as string[]).includes(opt) ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => toggleMultiSelect(opt)}
              >
                {opt}
              </Badge>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleSave(key)}
              disabled={isPending}
              className="rounded p-1 text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between" key={key}>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex flex-wrap gap-1">
            {value.length > 0 ? (
              value.map((v) => <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>)
            ) : (
              <p className="text-sm text-muted-foreground">未设置</p>
            )}
          </div>
        </div>
        {isEditable && (
          <button
            onClick={() => handleEdit(key, value)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        案例标签
      </p>

      {SINGLE_SELECT_DIMENSIONS.map(({ key, label, options }) =>
        renderSingleSelect(key, label, options, tags[key]),
      )}

      {MULTI_SELECT_DIMENSIONS.map(({ key, label, options }) =>
        renderMultiSelect(key, label, options, tags[key]),
      )}

      <div>
        <p className="text-xs text-muted-foreground">关键词标签</p>
        <div className="flex flex-wrap gap-1">
          {tags.keywordTags.length > 0 ? (
            tags.keywordTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">未设置</p>
          )}
        </div>
      </div>

      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => void handleReExtract()}
          disabled={reExtracting || !isEditable}
        >
          {reExtracting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 size-4" />
          )}
          重新抽取标签
        </Button>
      )}
    </div>
  );
}
