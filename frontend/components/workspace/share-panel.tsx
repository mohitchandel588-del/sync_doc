"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/store/workspace-store";
import { formatDisplayName } from "@/lib/utils";
import type { DocumentRecord } from "@/types";

export const SharePanel = ({ document }: { document: DocumentRecord }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const {
    collaborators,
    inviteCollaborator,
    updateCollaboratorRole,
    removeCollaborator
  } = useWorkspaceStore();
  const isOwner = document.role === "OWNER";

  return (
    <div className="flex h-full min-h-[20rem] flex-col">
      {isOwner ? (
        <form
          className="grid gap-3 rounded-[1.5rem] border border-sand/80 bg-white/70 p-4"
          onSubmit={async (event) => {
            event.preventDefault();

            try {
              await inviteCollaborator(document.id, email, role);
              setEmail("");
              toast.success("Collaborator access updated.");
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Unable to update access."
              );
            }
          }}
        >
          <Input
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Invite by email"
            type="email"
            value={email}
          />
          <div className="flex items-center gap-3">
            <select
              className="h-11 rounded-2xl border border-sand/80 bg-white/80 px-4 text-sm text-ink outline-none"
              onChange={(event) =>
                setRole(event.target.value as "EDITOR" | "VIEWER")
              }
              value={role}
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <Button className="flex-1" type="submit">
              Save Access
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-[1.5rem] border border-sand/80 bg-white/70 p-4 text-sm leading-6 text-slate-600">
          Owners manage roles here. You can still see who has access to this
          document.
        </div>
      )}

      <div className="mt-4 space-y-3 overflow-y-auto pr-1">
        {collaborators.map((collaborator) => (
          <div
            key={collaborator.id}
            className="rounded-[1.4rem] border border-sand/80 bg-white/80 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  {formatDisplayName(collaborator)}
                </p>
                <p className="text-xs text-slate-500">{collaborator.email}</p>
              </div>
              <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-slate-600">
                {collaborator.role}
              </span>
            </div>

            {isOwner && collaborator.id !== document.ownerId ? (
              <div className="mt-3 flex items-center gap-3">
                <select
                  className="h-10 rounded-2xl border border-sand/80 bg-white px-4 text-sm text-ink outline-none"
                  onChange={async (event) => {
                    try {
                      await updateCollaboratorRole(
                        document.id,
                        collaborator.id,
                        event.target.value as "EDITOR" | "VIEWER"
                      );
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Unable to update collaborator role."
                      );
                    }
                  }}
                  value={collaborator.role}
                >
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <Button
                  onClick={async () => {
                    try {
                      await removeCollaborator(document.id, collaborator.id);
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Unable to remove collaborator."
                      );
                    }
                  }}
                  type="button"
                  variant="ghost"
                >
                  Remove
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
