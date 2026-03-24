"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, LoaderCircle, Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardEmpty } from "@/components/workspace/dashboard-empty";
import { DocumentEditor } from "@/components/workspace/document-editor";
import { DocumentSidebar } from "@/components/workspace/document-sidebar";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { AiPanel } from "@/components/workspace/ai-panel";
import { SharePanel } from "@/components/workspace/share-panel";
import { useAuthStore } from "@/store/auth-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import { formatDisplayName } from "@/lib/utils";

export const WorkspaceView = ({
  documentId
}: {
  documentId?: string;
}) => {
  const router = useRouter();
  const { token, user, hydrate, logout } = useAuthStore();
  const {
    documents,
    currentDocument,
    collaborators,
    presence,
    saveStatus,
    rightPanel,
    isDocumentsLoading,
    isDocumentLoading,
    fetchDocuments,
    createDocument,
    loadDocument,
    renameDocument,
    deleteDocument,
    fetchMessages,
    fetchCollaborators,
    connectSocket,
    joinDocument,
    leaveDocument,
    saveCurrentDocument,
    setRightPanel,
    disconnectSocket
  } = useWorkspaceStore();
  const deferredDocuments = useDeferredValue(documents);
  const [titleDraft, setTitleDraft] = useState("");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const activeDocument =
    documentId && currentDocument?.id === documentId ? currentDocument : null;
  const canEdit = activeDocument?.role === "EDITOR" || activeDocument?.role === "OWNER";

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!token) {
      return;
    }

    connectSocket(token);
  }, [connectSocket, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void fetchDocuments().catch((error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to load documents."
      );
    });
  }, [fetchDocuments, token]);

  useEffect(() => {
    if (!documentId) {
      return;
    }

    void Promise.all([
      loadDocument(documentId),
      fetchMessages(documentId),
      fetchCollaborators(documentId)
    ]).catch((error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to load document workspace."
      );
    });

    joinDocument(documentId);

    return () => {
      leaveDocument(documentId);
    };
  }, [
    documentId,
    fetchCollaborators,
    fetchMessages,
    joinDocument,
    leaveDocument,
    loadDocument
  ]);

  useEffect(() => {
    setTitleDraft(activeDocument?.title ?? "");
  }, [activeDocument?.title]);

  useEffect(() => {
    setIsExportMenuOpen(false);
  }, [activeDocument?.id]);

  useEffect(() => {
    if (!isExportMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isExportMenuOpen]);

  const headerSummary = useMemo(() => {
    if (!activeDocument) {
      return "Pick a doc to collaborate in real time.";
    }

    return `${activeDocument.role.toLowerCase()} access - ${collaborators.length} collaborators`;
  }, [activeDocument, collaborators.length]);

  const handleCreateDocument = async () => {
    try {
      const document = await createDocument();
      router.push(`/workspace/${document.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create document."
      );
    }
  };

  const handleDeleteDocument = async (targetDocumentId: string) => {
    try {
      await deleteDocument(targetDocumentId);

      if (documentId === targetDocumentId) {
        router.push("/workspace");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete document."
      );
    }
  };

  const handleExport = async (format: "txt" | "pdf") => {
    if (!activeDocument) {
      return;
    }

    const documentTitle = activeDocument.title.trim() || "Untitled Document";
    const documentText =
      activeDocument.contentText.trim() || "This document is empty.";
    const fileName =
      documentTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "syncdoc-document";

    try {
      if (format === "txt") {
        const blob = new Blob([`${documentTitle}\n\n${documentText}`], {
          type: "text/plain;charset=utf-8"
        });
        const downloadUrl = window.URL.createObjectURL(blob);
        const anchor = window.document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = `${fileName}.txt`;
        anchor.click();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
          unit: "pt",
          format: "a4"
        });

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(20);
        pdf.text(documentTitle, 40, 56);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);

        const wrappedLines = pdf.splitTextToSize(documentText, 515);
        pdf.text(wrappedLines, 40, 90);
        pdf.save(`${fileName}.pdf`);
      }

      toast.success(`Document exported as .${format}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to export document."
      );
    }
  };

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_22rem] xl:grid-cols-[18rem_minmax(0,1fr)_24rem] xl:grid-rows-1">
        <DocumentSidebar
          activeDocumentId={documentId}
          currentUser={user}
          documents={deferredDocuments}
          onCreate={handleCreateDocument}
          onDelete={(targetDocumentId) => void handleDeleteDocument(targetDocumentId)}
          onLogout={() => {
            disconnectSocket();
            logout();
            router.push("/login");
          }}
          onOpen={(targetDocumentId) => router.push(`/workspace/${targetDocumentId}`)}
        />

        <section className="flex min-h-[40rem] flex-col gap-4">
          <div className="panel rounded-[2rem] px-5 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Active Workspace
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {activeDocument ? activeDocument.title : "Select a document"}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{headerSummary}</p>
              </div>

              {activeDocument ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm text-slate-600">
                    <Users className="h-4 w-4 text-teal" />
                    {presence.length} active
                  </div>
                  <span className="rounded-full bg-mist px-3 py-2 text-sm text-slate-600">
                    {activeDocument.role}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {isDocumentLoading ? (
            <div className="panel flex min-h-[60vh] items-center justify-center rounded-[2rem]">
              <LoaderCircle className="h-6 w-6 animate-spin text-teal" />
            </div>
          ) : activeDocument ? (
            <>
              <div
                className={`panel relative rounded-[2rem] px-5 py-4 ${
                  isExportMenuOpen ? "z-30" : "z-10"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Document Title
                    </p>
                    {activeDocument.role === "OWNER" ? (
                      <input
                        className="mt-2 w-full rounded-2xl border border-sand/80 bg-white/80 px-4 py-3 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-[-0.05em] text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
                        onBlur={() => {
                          const trimmed = titleDraft.trim();

                          if (!trimmed || trimmed === activeDocument.title) {
                            setTitleDraft(activeDocument.title);
                            return;
                          }

                          startTransition(() => {
                            void renameDocument(activeDocument.id, trimmed).catch((error) => {
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : "Unable to rename document."
                              );
                            });
                          });
                        }}
                        onChange={(event) => setTitleDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                        value={titleDraft}
                      />
                    ) : (
                      <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-[-0.05em] text-ink">
                        {activeDocument.title}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canEdit ? (
                      <Button
                        onClick={() => void saveCurrentDocument()}
                        variant={saveStatus === "saved" ? "secondary" : "primary"}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {saveStatus === "saving"
                          ? "Saving..."
                          : saveStatus === "saved"
                            ? "Saved"
                            : "Save"}
                      </Button>
                    ) : null}
                    <div className="relative" ref={exportMenuRef}>
                      <Button
                        onClick={() => setIsExportMenuOpen((current) => !current)}
                        variant="secondary"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                      {isExportMenuOpen ? (
                        <div className="absolute right-0 top-full z-50 mt-2 min-w-[13rem] rounded-2xl border border-sand/80 bg-white p-2 shadow-panel">
                          <button
                            className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-mist/80"
                            onClick={() => {
                              setIsExportMenuOpen(false);
                              void handleExport("txt");
                            }}
                            type="button"
                          >
                            Export as TXT
                          </button>
                          <button
                            className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-mist/80"
                            onClick={() => {
                              setIsExportMenuOpen(false);
                              void handleExport("pdf");
                            }}
                            type="button"
                          >
                            Export as PDF
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <DocumentEditor canEdit={canEdit} document={activeDocument} />
            </>
          ) : (
            <DashboardEmpty
              hasDocuments={!isDocumentsLoading && documents.length > 0}
              onCreate={handleCreateDocument}
            />
          )}
        </section>

        <aside className="panel rounded-[2rem] px-5 py-5 lg:col-start-2 lg:row-start-2 xl:col-start-3 xl:row-start-1">
          {activeDocument ? (
            <>
              <div className="flex flex-wrap gap-2 border-b border-sand/80 pb-4">
                <Button
                  onClick={() => setRightPanel("chat")}
                  variant={rightPanel === "chat" ? "primary" : "secondary"}
                >
                  Chat
                </Button>
                <Button
                  onClick={() => setRightPanel("ai")}
                  variant={rightPanel === "ai" ? "primary" : "secondary"}
                >
                  AI
                </Button>
                <Button
                  onClick={() => setRightPanel("share")}
                  variant={rightPanel === "share" ? "primary" : "secondary"}
                >
                  Share
                </Button>
              </div>

              <div className="mt-4 h-[calc(100%-4rem)]">
                {rightPanel === "chat" && user ? (
                  <ChatPanel currentUser={user} document={activeDocument} />
                ) : null}
                {rightPanel === "ai" ? <AiPanel document={activeDocument} /> : null}
                {rightPanel === "share" ? (
                  <SharePanel document={activeDocument} />
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col justify-between rounded-[1.8rem] bg-white/70 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Ready to Collaborate
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-[-0.05em] text-ink">
                  Document chat, AI, and access controls live here.
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Pick a doc from the sidebar to open the real-time editor, see
                  presence, and manage permissions.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-sand/80 bg-mist/80 p-4 text-sm text-slate-600">
                Signed in as {formatDisplayName(user ?? undefined)}.
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
};
