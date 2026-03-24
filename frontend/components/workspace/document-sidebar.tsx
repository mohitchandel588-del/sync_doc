"use client";

import { FileText, LogOut, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDisplayName } from "@/lib/utils";
import type { DocumentRecord, User } from "@/types";

type DocumentSidebarProps = {
  documents: DocumentRecord[];
  activeDocumentId?: string;
  currentUser: User | null;
  onCreate: () => void;
  onOpen: (documentId: string) => void;
  onDelete: (documentId: string) => void;
  onLogout: () => void;
};

export const DocumentSidebar = ({
  documents,
  activeDocumentId,
  currentUser,
  onCreate,
  onOpen,
  onDelete,
  onLogout
}: DocumentSidebarProps) => (
  <aside className="panel rounded-[2rem] px-4 py-5 lg:row-span-2">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal">
          SyncDoc
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-[-0.05em] text-ink">
          Workspace
        </h1>
      </div>
      <Button className="h-10 w-10 rounded-2xl px-0" onClick={onCreate}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>

    <div className="mt-5 rounded-[1.5rem] border border-sand/80 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        Signed in
      </p>
      <p className="mt-2 font-medium text-ink">{formatDisplayName(currentUser ?? undefined)}</p>
      <p className="text-sm text-slate-500">{currentUser?.email}</p>
    </div>

    <div className="mt-6 flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        Documents
      </p>
      <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-white">
        {documents.length}
      </span>
    </div>

    <div className="mt-3 grid gap-2">
      {documents.map((document) => {
        const isActive = document.id === activeDocumentId;

        return (
          <div
            key={document.id}
            className={cn(
              "group rounded-[1.4rem] border px-3 py-3 text-left transition",
              isActive
                ? "border-teal/30 bg-teal/10"
                : "border-transparent bg-white/60 hover:border-sand hover:bg-white"
            )}
            onClick={() => onOpen(document.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen(document.id);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal" />
                  <p className="truncate text-sm font-medium text-ink">
                    {document.title}
                  </p>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {document.role}
                </p>
              </div>

              {document.role === "OWNER" ? (
                <button
                  className="rounded-xl p-2 text-slate-400 opacity-0 transition hover:bg-coral/10 hover:text-coral group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(document.id);
                  }}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>

    <Button
      className="mt-6 w-full justify-center"
      onClick={onLogout}
      variant="secondary"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  </aside>
);
