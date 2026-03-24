import { WorkspaceView } from "@/components/workspace/workspace-view";

export default async function DocumentWorkspacePage({
  params
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return <WorkspaceView documentId={documentId} />;
}
