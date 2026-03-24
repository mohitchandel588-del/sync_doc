export type Role = "OWNER" | "EDITOR" | "VIEWER";
export type MessageType = "TEXT" | "FILE" | "SYSTEM";
export type AiAction = "summarize" | "fix-grammar-tone";

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
}

export interface Collaborator extends User {
  role: Role;
}

export interface DocumentRecord {
  id: string;
  title: string;
  content: Record<string, unknown>;
  contentText: string;
  ownerId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  role: Role;
  owner: User;
  collaborators: Collaborator[];
}

export interface ChatAttachment {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  documentId: string;
  senderId: string;
  message: string | null;
  type: MessageType;
  createdAt: string;
  sender: User;
  file: ChatAttachment | null;
  clientTempId?: string;
  optimistic?: boolean;
}

export interface PresenceUser {
  id: string;
  email: string;
  name: string | null;
}

