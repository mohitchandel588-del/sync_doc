"use client";

import { useCallback, useEffect, useRef } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { DocumentRecord } from "@/types";

type DocumentEditorProps = {
  document: DocumentRecord;
  canEdit: boolean;
};

export const DocumentEditor = ({
  document,
  canEdit
}: DocumentEditorProps) => {
  const {
    sendDocumentChange,
    setLocalDraft,
    streamAiAction,
    lastRemoteEditor,
    setRightPanel
  } = useWorkspaceStore();
  const remoteUpdateRef = useRef(false);
  const canEditRef = useRef(canEdit);
  const versionRef = useRef(document.version);
  const syncQueueRef = useRef<{
    sending: boolean;
    pending: { content: Record<string, unknown>; contentText: string } | null;
  }>({
    sending: false,
    pending: null
  });

  useEffect(() => {
    canEditRef.current = canEdit;
  }, [canEdit]);

  useEffect(() => {
    versionRef.current = document.version;
  }, [document.version]);

  const flushQueue = useCallback(async () => {
    const queue = syncQueueRef.current;

    if (queue.sending || !queue.pending) {
      return;
    }

    queue.sending = true;
    const payload = queue.pending;
    queue.pending = null;

    const result = await sendDocumentChange({
      documentId: document.id,
      content: payload.content,
      contentText: payload.contentText,
      baseVersion: versionRef.current
    });

    if (result.document) {
      versionRef.current = result.document.version;
    }

    queue.sending = false;

    if (queue.pending) {
      await flushQueue();
    }
  }, [document.id, sendDocumentChange]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: canEdit
          ? "Start writing. Your collaborators will see changes live."
          : "Viewer mode is read-only."
      })
    ],
    immediatelyRender: false,
    editable: canEdit,
    content: document.content as any,
    editorProps: {
      attributes: {
        class:
          "tiptap rounded-[1.7rem] bg-white px-6 py-8 focus:outline-none"
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      if (remoteUpdateRef.current) {
        return;
      }

      const content = currentEditor.getJSON() as Record<string, unknown>;
      const contentText = currentEditor.getText();
      setLocalDraft(content, contentText);

      if (!canEditRef.current) {
        return;
      }

      syncQueueRef.current.pending = {
        content,
        contentText
      };

      void flushQueue();
    }
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(canEdit);
  }, [canEdit, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent = JSON.stringify(document.content);
    const currentContent = JSON.stringify(editor.getJSON());

    if (currentContent === nextContent) {
      return;
    }

    remoteUpdateRef.current = true;
    editor.commands.setContent(document.content as any, false);

    window.requestAnimationFrame(() => {
      remoteUpdateRef.current = false;
    });
  }, [document.content, document.id, editor]);

  return (
    <div className="panel rounded-[2rem]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand/80 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Editor Surface
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {canEdit ? "Live editing enabled." : "Read-only access."}
            {lastRemoteEditor ? ` ${lastRemoteEditor.name || lastRemoteEditor.email} is editing.` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setRightPanel("ai");
              void streamAiAction(
                document.id,
                "summarize",
                editor?.getText() || document.contentText
              );
            }}
            variant="secondary"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Summarize
          </Button>
          <Button
            onClick={() => {
              setRightPanel("ai");
              void streamAiAction(
                document.id,
                "fix-grammar-tone",
                editor?.getText() || document.contentText
              );
            }}
            variant="secondary"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Fix Grammar & Tone
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
