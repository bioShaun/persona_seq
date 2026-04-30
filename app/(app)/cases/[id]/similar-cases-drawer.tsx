"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimilarCasesPanel, type SimilarCaseItem } from "@/components/similar-cases-panel";

export function SimilarCasesDrawer({
  cases,
}: {
  cases: SimilarCaseItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="shrink-0 self-start"
      >
        {isOpen ? (
          <ChevronDown className="mr-1 size-4" />
        ) : (
          <ChevronRight className="mr-1 size-4" />
        )}
        {isOpen ? "收起" : "相似案例"}
      </Button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "w-80 opacity-100" : "w-0 opacity-0"
        }`}
      >
        <SimilarCasesPanel cases={cases} />
      </div>
    </div>
  );
}
