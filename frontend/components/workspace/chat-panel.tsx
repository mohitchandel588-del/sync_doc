"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Paperclip, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn, formatDisplayName, formatFileSize } from "@/lib/utils";
import type { DocumentRecord, User } from "@/types";

type ChatPanelProps = {
  document: DocumentRecord;
  currentUser: User;
};

export const ChatPanel = ({ document, currentUser }: ChatPanelProps) => {
  const [draft, setDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { messages, sendChatMessage, uploadFile } = useWorkspaceStore();
  const canUpload = document.role === "EDITOR" || document.role === "OWNER";

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  return (
    <div className="flex h-full min-h-[20rem] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUser.id;

          return (
            <div
              key={message.id}
              className={cn(
                "rounded-[1.4rem] px-4 py-3",
                isOwn ? "bg-ink text-white" : "bg-white/80 text-ink"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={cn("text-sm font-medium", isOwn && "text-white")}>
                  {formatDisplayName(message.sender)}
                </p>
                <p
                  className={cn(
                    "text-[11px]",
                    isOwn ? "text-white/70" : "text-slate-500"
                  )}
                >
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true
                  })}
                </p>
              </div>

              {message.type === "FILE" && message.file ? (
                <a
                  className={cn(
                    "mt-3 block rounded-2xl border px-3 py-3 text-sm transition",
                    isOwn
                      ? "border-white/10 bg-white/10 hover:bg-white/15"
                      : "border-sand/80 bg-mist/70 hover:bg-mist"
                  )}
                  href={message.file.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <p className="font-medium">{message.file.fileName}</p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      isOwn ? "text-white/70" : "text-slate-500"
                    )}
                  >
                    {message.file.mimeType} - {formatFileSize(message.file.size)}
                  </p>
                </a>
              ) : null}

              {message.message ? (
                <p
                  className={cn(
                    "mt-2 whitespace-pre-wrap text-sm leading-6",
                    isOwn && "text-white"
                  )}
                >
                  {message.message}
                </p>
              ) : null}

              {message.optimistic ? (
                <p
                  className={cn(
                    "mt-2 text-[11px]",
                    isOwn ? "text-white/65" : "text-slate-400"
                  )}
                >
                  Sending...
                </p>
              ) : null}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="mt-4 grid gap-3 border-t border-sand/80 pt-4">
        <textarea
          className="min-h-[88px] w-full resize-none rounded-[1.5rem] border border-sand/80 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-teal focus:ring-2 focus:ring-teal/20"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask a question, leave context, or note a decision."
          value={draft}
        />
        <div className="flex items-center justify-between gap-3">
          <div>
            <input
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];

                if (!file) {
                  return;
                }

                try {
                  await uploadFile(document.id, file);
                } finally {
                  event.target.value = "";
                }
              }}
              ref={fileInputRef}
              type="file"
            />
            <Button
              disabled={!canUpload}
              onClick={() => fileInputRef.current?.click()}
              type="button"
              variant="secondary"
            >
              <Paperclip className="mr-2 h-4 w-4" />
              {canUpload ? "Upload File" : "Upload disabled for viewers"}
            </Button>
          </div>
          <Button
            onClick={() => {
              sendChatMessage(document.id, draft, currentUser);
              setDraft("");
            }}
            type="button"
          >
            <SendHorizontal className="mr-2 h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
