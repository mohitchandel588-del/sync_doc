import { Button } from "@/components/ui/button";

export const DashboardEmpty = ({
  hasDocuments,
  onCreate
}: {
  hasDocuments: boolean;
  onCreate: () => void;
}) => (
  <div className="panel flex min-h-[70vh] flex-col justify-between rounded-[2rem] px-8 py-8">
    <div>
      <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal">
        Workspace Dashboard
      </span>
      <h2 className="mt-6 max-w-2xl font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-[-0.05em] text-ink">
        {hasDocuments
          ? "Choose a document from the left rail or spin up a fresh workspace page."
          : "Create your first collaborative doc and invite teammates with granular roles."}
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
        SyncDoc combines real-time editing, document chat, file sharing, live
        presence, and Gemini writing assistance in one flow.
      </p>
    </div>

    <div className="mt-10 flex flex-wrap items-center gap-3">
      <Button onClick={onCreate}>Create Document</Button>
      <div className="rounded-2xl border border-sand/80 bg-white/70 px-4 py-3 text-sm text-slate-600">
        Roles are enforced server-side: viewers read and chat, editors can write
        and upload, owners control access.
      </div>
    </div>
  </div>
);

