"use client";

import { LoaderCircle, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { DocumentRecord } from "@/types";

export const AiPanel = ({ document }: { document: DocumentRecord }) => {
  const { aiOutput, aiLoading, clearAiOutput, streamAiAction } = useWorkspaceStore();

  return (
    <div className="flex h-full min-h-[20rem] flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() =>
            void streamAiAction(document.id, "summarize", document.contentText)
          }
          variant="secondary"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Summarize
        </Button>
        <Button
          onClick={() =>
            void streamAiAction(document.id, "fix-grammar-tone", document.contentText)
          }
          variant="secondary"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Fix Grammar & Tone
        </Button>
        <Button onClick={clearAiOutput} variant="ghost">
          Clear
        </Button>
      </div>

      <div className="mt-4 flex-1 rounded-[1.5rem] border border-sand/80 bg-white/80 p-4">
        <div className="flex items-center justify-between gap-3 border-b border-sand/70 pb-3">
          <div>
            <p className="text-sm font-semibold text-ink">Gemini Stream</p>
            <p className="text-xs text-slate-500">
              Responses arrive token by token.
            </p>
          </div>
          {aiLoading ? (
            <LoaderCircle className="h-4 w-4 animate-spin text-teal" />
          ) : null}
        </div>

        <pre className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
          {aiOutput || "Run an AI action to generate a streaming response here."}
        </pre>
      </div>
    </div>
  );
};

