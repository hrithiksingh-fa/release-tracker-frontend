import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import { requirementsApi } from "../api/resources.js";
import type { RequirementRecord } from "../api/types.js";
import { RequirementStatusBadge, ReleaseNoteStatusBadge } from "../components/StatusBadge.js";

export function RequirementDetailPage() {
  const { requirementId } = useParams<{ requirementId: string }>();
  const [requirement, setRequirement] = useState<RequirementRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState<"existing" | "new" | null>(null);

  function reload() {
    if (!requirementId) return;
    requirementsApi.get(requirementId).then(setRequirement).catch((err) => setError(err.message));
  }

  useEffect(reload, [requirementId]);

  async function unlink(linkedId: string) {
    if (!requirementId) return;
    await requirementsApi.unlink(requirementId, linkedId);
    reload();
  }

  if (!requirement) return <div className="p-8 text-sm text-[#9aa1ac]">{error ?? "Loading…"}</div>;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link to={`/trackers/${requirement.trackerId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-[#9aa1ac] hover:text-white">
        <ArrowLeft size={14} /> Back to tracker
      </Link>

      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-semibold">{requirement.title}</h1>
        <RequirementStatusBadge status={requirement.status} />
      </div>
      {requirement.description && <p className="mb-6 text-sm text-[#9aa1ac]">{requirement.description}</p>}

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#9aa1ac]">
            Linked ADO work items ({requirement.linkedWorkItems.length})
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setLinkMode("existing")} className="text-xs font-medium text-[#5b8cff] hover:underline">
              Link existing
            </button>
            <button onClick={() => setLinkMode("new")} className="text-xs font-medium text-[#5b8cff] hover:underline">
              Create in ADO
            </button>
          </div>
        </div>

        {linkMode && (
          <LinkWorkItemForm
            mode={linkMode}
            requirementId={requirement.id}
            onClose={() => setLinkMode(null)}
            onDone={() => {
              setLinkMode(null);
              reload();
            }}
          />
        )}

        {requirement.linkedWorkItems.length === 0 ? (
          <p className="text-sm text-[#9aa1ac]">
            No linked work items yet. This requirement stays "Not Started" until at least one is linked.
          </p>
        ) : (
          <div className="divide-y divide-[#2a2f3a] rounded-xl border border-[#2a2f3a] bg-[#171a21]">
            {requirement.linkedWorkItems.map((li) => (
              <div key={li.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-white">
                    #{li.adoId} {li.title ?? ""}
                  </div>
                  <div className="mt-0.5 text-xs text-[#9aa1ac]">
                    State: {li.adoState ?? "not synced yet"}
                    {li.lastSyncedAt ? ` · synced ${new Date(li.lastSyncedAt).toLocaleString()}` : ""}
                  </div>
                </div>
                <button onClick={() => unlink(li.id)} className="text-[#9aa1ac] hover:text-[#e05a5a]" title="Unlink">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[#9aa1ac]">
          Release notes ({requirement.releaseNotes?.length ?? 0})
        </h2>
        {!requirement.releaseNotes?.length ? (
          <p className="text-sm text-[#9aa1ac]">
            Generated automatically once every linked work item reaches a terminal state.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {requirement.releaseNotes.map((note) => (
              <Link
                key={note.id}
                to={`/review?noteId=${note.id}`}
                className="rounded-xl border border-[#2a2f3a] bg-[#171a21] p-4 hover:border-[#5b8cff]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">v{note.version}</span>
                  <ReleaseNoteStatusBadge status={note.status} />
                  <span className="text-xs text-[#9aa1ac]">{note.category}</span>
                </div>
                <p className="text-sm text-[#9aa1ac]">{note.problemStatement}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LinkWorkItemForm({
  mode,
  requirementId,
  onClose,
  onDone,
}: {
  mode: "existing" | "new";
  requirementId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [adoId, setAdoId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "existing") {
        const id = Number(adoId);
        if (!id) throw new Error("Enter a valid ADO work item id.");
        await requirementsApi.linkExisting(requirementId, id);
      } else {
        if (!title.trim()) throw new Error("Title is required.");
        await requirementsApi.createInAdo(requirementId, { title: title.trim(), description: description.trim() || undefined });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-3 rounded-xl border border-[#2a2f3a] bg-[#1e2229] p-4">
      {mode === "existing" ? (
        <input
          value={adoId}
          onChange={(e) => setAdoId(e.target.value)}
          placeholder="ADO work item id, e.g. 12345"
          className="w-full rounded-lg border border-[#2a2f3a] bg-[#171a21] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title for the new PBI"
            className="w-full rounded-lg border border-[#2a2f3a] bg-[#171a21] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-lg border border-[#2a2f3a] bg-[#171a21] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]"
          />
        </div>
      )}
      {error && <p className="mt-2 text-xs text-[#e05a5a]">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs text-[#9aa1ac] hover:text-white">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="flex items-center gap-1 rounded-lg bg-[#5b8cff] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={14} /> {mode === "existing" ? "Link" : "Create & link"}
        </button>
      </div>
    </div>
  );
}
