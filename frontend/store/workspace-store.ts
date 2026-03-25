"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { api, API_URL, getApiErrorMessage } from "@/lib/api";
import { createSocket } from "@/lib/socket";
import type {
  AiAction,
  ChatMessage,
  Collaborator,
  DocumentRecord,
  PresenceUser,
  Role,
  User
} from "@/types";

let remoteEditorTimeout: ReturnType<typeof setTimeout> | null = null;

const upsertDocument = (
  documents: DocumentRecord[],
  incomingDocument: DocumentRecord
) => {
  const nextDocuments = documents.some(
    (document) => document.id === incomingDocument.id
  )
    ? documents.map((document) =>
        document.id === incomingDocument.id ? incomingDocument : document
      )
    : [incomingDocument, ...documents];

  return [...nextDocuments].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

const mergeIncomingMessage = (
  currentMessages: ChatMessage[],
  incomingMessage: ChatMessage
) => {
  const byId = currentMessages.find((message) => message.id === incomingMessage.id);

  if (byId) {
    return currentMessages;
  }

  if (incomingMessage.clientTempId) {
    const replacedMessages = currentMessages.map((message) =>
      message.id === incomingMessage.clientTempId
        ? { ...incomingMessage, optimistic: false }
        : message
    );

    const hasReplacement = currentMessages.some(
      (message) => message.id === incomingMessage.clientTempId
    );

    return hasReplacement
      ? replacedMessages
      : [...currentMessages, { ...incomingMessage, optimistic: false }];
  }

  return [...currentMessages, incomingMessage];
};

type WorkspaceState = {
  documents: DocumentRecord[];
  currentDocument: DocumentRecord | null;
  messages: ChatMessage[];
  collaborators: Collaborator[];
  presence: PresenceUser[];
  lastRemoteEditor: PresenceUser | null;
  saveStatus: "saved" | "saving" | "unsaved";
  rightPanel: "chat" | "ai" | "share";
  aiOutput: string;
  aiLoading: boolean;
  isDocumentsLoading: boolean;
  isDocumentLoading: boolean;
  socket: ReturnType<typeof createSocket> | null;
  joinedDocumentId: string | null;
  fetchDocuments: () => Promise<void>;
  createDocument: (title?: string) => Promise<DocumentRecord>;
  loadDocument: (documentId: string) => Promise<void>;
  renameDocument: (documentId: string, title: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  fetchMessages: (documentId: string) => Promise<void>;
  fetchCollaborators: (documentId: string) => Promise<void>;
  inviteCollaborator: (
    documentId: string,
    email: string,
    role: Exclude<Role, "OWNER">
  ) => Promise<void>;
  updateCollaboratorRole: (
    documentId: string,
    userId: string,
    role: Exclude<Role, "OWNER">
  ) => Promise<void>;
  removeCollaborator: (documentId: string, userId: string) => Promise<void>;
  setLocalDraft: (content: Record<string, unknown>, contentText: string) => void;
  sendDocumentChange: (payload: {
    documentId: string;
    content: Record<string, unknown>;
    contentText: string;
    baseVersion: number;
  }) => Promise<{
    ok: boolean;
    reason?: string;
    document?: DocumentRecord;
    message?: string;
  }>;
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  joinDocument: (documentId: string) => void;
  leaveDocument: (documentId: string) => void;
  sendChatMessage: (
    documentId: string,
    message: string,
    currentUser: User
  ) => void;
  uploadFile: (documentId: string, file: File) => Promise<void>;
  saveCurrentDocument: () => Promise<void>;
  streamAiAction: (
    documentId: string,
    action: AiAction,
    content: string
  ) => Promise<void>;
  setRightPanel: (panel: "chat" | "ai" | "share") => void;
  clearAiOutput: () => void;
  isTyping: boolean;
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  isTyping: false,
  documents: [],
  currentDocument: null,
  messages: [],
  collaborators: [],
  presence: [],
  lastRemoteEditor: null,
  saveStatus: "saved",
  rightPanel: "chat",
  aiOutput: "",
  aiLoading: false,
  isDocumentsLoading: false,
  isDocumentLoading: false,
  socket: null,
  joinedDocumentId: null,
  fetchDocuments: async () => {
    set({
      isDocumentsLoading: true
    });

    try {
      const { data } = await api.get<{ documents: DocumentRecord[] }>("/documents");

      set({
        documents: data.documents,
        isDocumentsLoading: false
      });
    } catch (error) {
      set({
        isDocumentsLoading: false
      });
      throw error;
    }
  },
  createDocument: async (title) => {
    const { data } = await api.post<{ document: DocumentRecord }>("/documents", {
      title
    });

    set((state) => ({
      documents: upsertDocument(state.documents, data.document)
    }));

    return data.document;
  },
  loadDocument: async (documentId) => {
    set({
      isDocumentLoading: true
    });

    try {
      const { data } = await api.get<{ document: DocumentRecord }>(
        `/documents/${documentId}`
      );

      set((state) => ({
        currentDocument: data.document,
        documents: upsertDocument(state.documents, data.document),
        collaborators: data.document.collaborators,
        isDocumentLoading: false,
        saveStatus: "saved"
      }));
    } catch (error) {
      set({
        isDocumentLoading: false
      });
      throw error;
    }
  },
  renameDocument: async (documentId, title) => {
    const previousDocuments = get().documents;
    const previousCurrentDocument = get().currentDocument;

    set((state) => ({
      documents: state.documents.map((document) =>
        document.id === documentId ? { ...document, title } : document
      ),
      currentDocument:
        state.currentDocument?.id === documentId
          ? { ...state.currentDocument, title }
          : state.currentDocument
    }));

    try {
      const { data } = await api.patch<{ document: DocumentRecord }>(
        `/documents/${documentId}`,
        {
          title
        }
      );

      set((state) => ({
        documents: upsertDocument(state.documents, data.document),
        currentDocument:
          state.currentDocument?.id === documentId
            ? data.document
            : state.currentDocument
      }));
    } catch (error) {
      set({
        documents: previousDocuments,
        currentDocument: previousCurrentDocument
      });
      throw error;
    }
  },
  deleteDocument: async (documentId) => {
    await api.delete(`/documents/${documentId}`);

    set((state) => ({
      documents: state.documents.filter((document) => document.id !== documentId),
      currentDocument:
        state.currentDocument?.id === documentId ? null : state.currentDocument,
      messages: state.currentDocument?.id === documentId ? [] : state.messages,
      collaborators:
        state.currentDocument?.id === documentId ? [] : state.collaborators,
      saveStatus:
        state.currentDocument?.id === documentId ? "saved" : state.saveStatus
    }));
  },
  fetchMessages: async (documentId) => {
    const { data } = await api.get<{ messages: ChatMessage[] }>(
      `/chat/${documentId}/messages`
    );

    set({
      messages: data.messages
    });
  },
  fetchCollaborators: async (documentId) => {
    const { data } = await api.get<{ collaborators: Collaborator[] }>(
      `/permissions/${documentId}`
    );

    set((state) => ({
      collaborators: data.collaborators,
      currentDocument:
        state.currentDocument?.id === documentId
          ? {
              ...state.currentDocument,
              collaborators: data.collaborators
            }
          : state.currentDocument
    }));
  },
  inviteCollaborator: async (documentId, email, role) => {
    const { data } = await api.post<{ collaborator: Collaborator }>(
      `/permissions/${documentId}`,
      {
        email,
        role
      }
    );

    set((state) => ({
      collaborators: state.collaborators.some(
        (collaborator) => collaborator.id === data.collaborator.id
      )
        ? state.collaborators.map((collaborator) =>
            collaborator.id === data.collaborator.id
              ? data.collaborator
              : collaborator
          )
        : [...state.collaborators, data.collaborator],
      currentDocument:
        state.currentDocument?.id === documentId
          ? {
              ...state.currentDocument,
              collaborators: state.currentDocument.collaborators.some(
                (collaborator) => collaborator.id === data.collaborator.id
              )
                ? state.currentDocument.collaborators.map((collaborator) =>
                    collaborator.id === data.collaborator.id
                      ? data.collaborator
                      : collaborator
                  )
                : [...state.currentDocument.collaborators, data.collaborator]
            }
          : state.currentDocument
    }));
  },
  updateCollaboratorRole: async (documentId, userId, role) => {
    const { data } = await api.patch<{ collaborator: Collaborator }>(
      `/permissions/${documentId}/${userId}`,
      {
        role
      }
    );

    set((state) => ({
      collaborators: state.collaborators.map((collaborator) =>
        collaborator.id === userId ? data.collaborator : collaborator
      ),
      currentDocument:
        state.currentDocument?.id === documentId
          ? {
              ...state.currentDocument,
              collaborators: state.currentDocument.collaborators.map(
                (collaborator) =>
                  collaborator.id === userId ? data.collaborator : collaborator
              )
            }
          : state.currentDocument
    }));
  },
  removeCollaborator: async (documentId, userId) => {
    await api.delete(`/permissions/${documentId}/${userId}`);

    set((state) => ({
      collaborators: state.collaborators.filter(
        (collaborator) => collaborator.id !== userId
      ),
      currentDocument:
        state.currentDocument?.id === documentId
          ? {
              ...state.currentDocument,
              collaborators: state.currentDocument.collaborators.filter(
                (collaborator) => collaborator.id !== userId
              )
            }
          : state.currentDocument
    }));
  },
  setLocalDraft: (content, contentText) => {
    set((state) => ({
      currentDocument: state.currentDocument
        ? {
            ...state.currentDocument,
            content,
            contentText
          }
        : null,
      saveStatus: state.currentDocument ? "unsaved" : state.saveStatus
    }));
  },
  sendDocumentChange: async (payload) => {
    const socket = get().socket;

    set({
      saveStatus: "saving"
    });

    if (!socket) {
      const { data } = await api.put<{
        ok: boolean;
        document: DocumentRecord;
      }>(`/documents/${payload.documentId}/content`, payload);

      set((state) => ({
        currentDocument:
          state.currentDocument?.id === payload.documentId
            ? data.document
            : state.currentDocument,
        documents: upsertDocument(state.documents, data.document),
        saveStatus: "saved"
      }));

      return data;
    }

    return new Promise((resolve) => {
      socket.emit("document-change", payload, (result: any) => {
        if (result?.ok && result.document) {
          set((state) => ({
            currentDocument:
              state.currentDocument?.id === payload.documentId
                ? result.document
                : state.currentDocument,
            documents: upsertDocument(state.documents, result.document),
            saveStatus: "saved"
          }));

          resolve(result);
          return;
        }

        if (result?.reason === "conflict" && result.document) {
          set((state) => ({
            currentDocument:
              state.currentDocument?.id === payload.documentId
                ? result.document
                : state.currentDocument,
            documents: upsertDocument(state.documents, result.document),
            saveStatus: "saved"
          }));
          toast.error("A newer version arrived. Your editor was refreshed.");
          resolve(result);
          return;
        }

        set({
          saveStatus: "unsaved"
        });
        toast.error(result?.message || "Unable to sync the document.");
        resolve(result ?? { ok: false });
      });
    });
  },
  connectSocket: (token) => {
    if (get().socket) {
      return;
    }

    const socket = createSocket(token);

  socket.on("document-change", ({ document, editor }) => {
  set((state) => {
    // 🚫 Ignore updates while user is typing
    if (state.isTyping) return state;

    const isCurrent = state.currentDocument?.id === document.id;

    return {
      currentDocument: isCurrent ? document : state.currentDocument,
      documents: upsertDocument(state.documents, document),
      lastRemoteEditor: editor,
      saveStatus: isCurrent ? "saved" : state.saveStatus
    };
  });

  if (remoteEditorTimeout) {
    clearTimeout(remoteEditorTimeout);
  }

  remoteEditorTimeout = setTimeout(() => {
    set({
      lastRemoteEditor: null
    });
  }, 2500);
});

    socket.on("chat-message", (message: ChatMessage) => {
      set((state) => ({
        messages: mergeIncomingMessage(state.messages, message)
      }));
    });

    socket.on("user-presence", ({ users }: { users: PresenceUser[] }) => {
      set({
        presence: users
      });
    });

    set({
      socket
    });
  },
  disconnectSocket: () => {
    get().socket?.disconnect();
    set({
      socket: null,
      joinedDocumentId: null,
      presence: []
    });
  },
  joinDocument: (documentId) => {
    const socket = get().socket;

    if (!socket || get().joinedDocumentId === documentId) {
      return;
    }

    const previousDocumentId = get().joinedDocumentId;

    if (previousDocumentId) {
      socket.emit("leave-document", previousDocumentId);
    }

    socket.emit("join-document", documentId, (result: { ok: boolean; message?: string }) => {
      if (!result.ok) {
        toast.error(result.message || "Unable to join the document room.");
        return;
      }

      set({
        joinedDocumentId: documentId
      });
    });
  },
  leaveDocument: (documentId) => {
    get().socket?.emit("leave-document", documentId);
    set({
      joinedDocumentId: null,
      presence: []
    });
  },
  sendChatMessage: (documentId, message, currentUser) => {
    const socket = get().socket;
    const trimmedMessage = message.trim();

    if (!socket || !trimmedMessage) {
      return;
    }

    const tempId = `temp-${crypto.randomUUID()}`;

    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: tempId,
          documentId,
          senderId: currentUser.id,
          message: trimmedMessage,
          type: "TEXT",
          createdAt: new Date().toISOString(),
          sender: currentUser,
          file: null,
          optimistic: true,
          clientTempId: tempId
        }
      ]
    }));

    socket.emit(
      "chat-message",
      {
        documentId,
        message: trimmedMessage,
        clientTempId: tempId
      },
      (result: { ok: boolean; message?: string }) => {
        if (result.ok) {
          return;
        }

        set((state) => ({
          messages: state.messages.filter((item) => item.id !== tempId)
        }));
        toast.error(result.message || "Unable to send the message.");
      }
    );
  },
  uploadFile: async (documentId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post<{ message: ChatMessage }>(
        `/upload/${documentId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      set((state) => ({
        messages: mergeIncomingMessage(state.messages, data.message)
      }));
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to upload the selected file.")
      );
    }
  },
  saveCurrentDocument: async () => {
    const currentDocument = get().currentDocument;

    if (!currentDocument) {
      toast.error("Open a document before saving.");
      return;
    }

    if (currentDocument.role === "VIEWER") {
      toast.error("Viewer access cannot save document changes.");
      return;
    }

    if (get().saveStatus === "saving") {
      toast.message("Save already in progress.");
      return;
    }

    if (get().saveStatus === "saved") {
      toast.success("All changes are already saved.");
      return;
    }

    const result = await get().sendDocumentChange({
      documentId: currentDocument.id,
      content: currentDocument.content,
      contentText: currentDocument.contentText,
      baseVersion: currentDocument.version
    });

    if (result.ok) {
      toast.success("Document saved.");
    }
  },
  streamAiAction: async (documentId, action, content) => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("syncdoc_token")
        : null;

    if (!token) {
      toast.error("You need to sign in again before using AI.");
      return;
    }

    set({
      aiOutput: "",
      aiLoading: true,
      rightPanel: "ai"
    });

    try {
      const response = await fetch(`${API_URL}/ai/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId,
          action,
          content
        })
      });

      if (!response.ok) {
        const errorBody = await response
          .json()
          .catch(() => ({ message: "Unable to stream AI output." }));

        throw new Error(errorBody.message || "Unable to stream AI output.");
      }

      if (!response.body) {
        throw new Error("Unable to stream AI output.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;

        if (!chunk.value) {
          continue;
        }

        const text = decoder.decode(chunk.value, {
          stream: !done
        });

        set((state) => ({
          aiOutput: `${state.aiOutput}${text}`
        }));
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to stream AI output."));
    } finally {
      set({
        aiLoading: false
      });
    }
  },
  setRightPanel: (panel) => {
    set({
      rightPanel: panel
    });
  },
  clearAiOutput: () => {
    set({
      aiOutput: ""
    });
  }
}));
