import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X, Frame, Pencil, Send } from "lucide-react";
import { Button, IconButton } from "fieldassist-ui";
import { requirementsApi } from "../api/resources.js";
import type { RequirementRecord } from "../api/types.js";
import { StageBadge, ReleaseNoteStatusBadge, PriorityBadge } from "../components/StatusBadge.js";
import { TimelineButton, TimelinePanel } from "../components/Timeline.js";
import { RequirementFormModal } from "../components/RequirementFormModal.js";

export function RequirementDetailPage() {
  const { requirementId } = useParams<{ requirementId: string }>();
  const [requirement, setRequirement] = useState<RequirementRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState<"existing" | "new" | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [editing, setEditing] = useState(false);

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

  async function moveStage(workflowStageId: string) {
    if (!requirementId) return;
    const result = await requirementsApi.moveStage(requirementId, workflowStageId);
    if (result.releaseNoteWarning) setError(result.releaseNoteWarning);
    else setError(null);
    reload();
  }

  if (!requirement) return <div className="p-8 text-sm text-[var(--text-dim)]">{error ?? "Loading…"}</div>;

  const workflowStages = requirement.phase?.client.requirementWorkflow?.stages ?? [];

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link to={`/phases/${requirement.phaseId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-dim)] hover:text-[var(--text)]">
        <ArrowLeft size={14} /> Back to phase
      </Link>

      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{requirement.title}</h1>
          {requirement.stage && <StageBadge name={requirement.stage.stage.name} color={requirement.stage.stage.color} />}
          <PriorityBadge priority={requirement.priority} />
        </div>
        <div className="flex gap-2">
          <TimelineButton onClick={() => setShowTimeline(true)} />
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-dim)] hover:border-[var(--accent)] hover:text-[var(--text)]"
          >
            <Pencil size={14} /> Edit
          </button>
        </div>
      </div>
      {requirement.description && <p className="mb-4 text-sm text-[var(--text-dim)]">{requirement.description}</p>}

      {error && (
        <p className="mb-4 rounded-lg border border-[var(--amber)]/35 bg-[var(--amber)]/10 px-3 py-2 text-sm text-[var(--amber)]">
          {error}
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {workflowStages.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-dim)]">Stage</span>
            <select
              value={requirement.stageId ?? ""}
              onChange={(e) => moveStage(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            >
              {workflowStages.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.stage.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <MetaField label="Delivery date" value={requirement.deliveryDate ? new Date(requirement.deliveryDate).toLocaleDateString() : null} />
        <MetaField label="Module" value={requirement.module?.name ?? null} />
        <MetaField label="Category" value={requirement.category?.name ?? null} />
        <MetaField label="Product owner" value={requirement.productOwner} />
        <MetaField
          label="Asana"
          value={requirement.asanaLink}
          href={requirement.asanaLink ?? undefined}
        />
      </div>

      {(requirement.releaseNotesText || requirement.generalRemarks) && (
        <div className="mb-6 flex flex-col gap-3">
          {requirement.releaseNotesText && (
            <div>
              <div className="text-xs font-medium text-[var(--text-dim)]">Release notes</div>
              <p className="mt-0.5 text-sm text-[var(--text)]">{requirement.releaseNotesText}</p>
            </div>
          )}
          {requirement.generalRemarks && (
            <div>
              <div className="text-xs font-medium text-[var(--text-dim)]">General remarks</div>
              <p className="mt-0.5 text-sm text-[var(--text)]">{requirement.generalRemarks}</p>
            </div>
          )}
        </div>
      )}

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-dim)]">
            Linked PBIs ({requirement.linkedWorkItems.length})
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setLinkMode("existing")} className="text-xs font-medium text-[var(--accent)] hover:underline">
              Link existing
            </button>
            <button onClick={() => setLinkMode("new")} className="text-xs font-medium text-[var(--accent)] hover:underline">
              Create PBI
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
          <p className="text-sm text-[var(--text-dim)]">No linked PBIs yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--panel)]">
            {requirement.linkedWorkItems.map((li) => (
              <div key={li.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">
                    #{li.adoId} {li.title ?? ""}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--text-dim)]">
                    State: {li.adoState ?? "not synced yet"}
                    {li.lastSyncedAt ? ` · synced ${new Date(li.lastSyncedAt).toLocaleString()}` : ""}
                  </div>
                </div>
                <button onClick={() => unlink(li.id)} className="text-[var(--text-dim)] hover:text-[var(--red)]" title="Unlink">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <FigmaReferencesSection requirement={requirement} onChange={reload} />

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-dim)]">
          Release notes ({requirement.releaseNotes?.length ?? 0})
        </h2>
        {!requirement.releaseNotes?.length ? (
          <p className="text-sm text-[var(--text-dim)]">
            Generated automatically when this requirement is moved into a "Done"-flagged stage.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {requirement.releaseNotes.map((note) => (
              <Link
                key={note.id}
                to={`/review?noteId=${note.id}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 hover:border-[var(--accent)]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--text)]">v{note.version}</span>
                  <ReleaseNoteStatusBadge status={note.status} />
                  <span className="text-xs text-[var(--text-dim)]">{note.category}</span>
                </div>
                <p className="text-sm text-[var(--text-dim)]">{note.problemStatement}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <CommentsSection requirement={requirement} onChange={reload} />

      {editing && (
        <RequirementFormModal
          requirement={requirement}
          phaseId={requirement.phaseId}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reload();
          }}
        />
      )}
      {showTimeline && (
        <TimelinePanel entityType="requirement" entityId={requirement.id} onClose={() => setShowTimeline(false)} />
      )}
    </div>
  );
}

function MetaField({ label, value, href }: { label: string; value: string | null; href?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--text-dim)]">{label}</span>
      {value && href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="truncate text-sm text-[var(--accent)] hover:underline">
          Open
        </a>
      ) : (
        <span className="text-sm text-[var(--text)]">{value ?? "—"}</span>
      )}
    </div>
  );
}

// Jira-style comment thread -- unlimited remarks, shown below the
// description/metadata. Each addition also lands in the audit Timeline.
function CommentsSection({ requirement, onChange }: { requirement: RequirementRecord; onChange: () => void }) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const comments = requirement.comments ?? [];

  async function submit() {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await requirementsApi.addComment(requirement.id, body.trim());
      setBody("");
      onChange();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-[var(--text-dim)]">Comments ({comments.length})</h2>
      <div className="mb-4 flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a remark…"
          rows={2}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={submit}
          disabled={submitting || !body.trim()}
          className="flex h-fit items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </div>
      {comments.length === 0 ? (
        <p className="text-sm text-[var(--text-dim)]">No remarks yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
              <div className="mb-1 text-xs text-[var(--text-dim)]">
                {c.author} · {new Date(c.createdAt).toLocaleString()}
              </div>
              <p className="text-sm text-[var(--text)]">{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FigmaReferencesSection({
  requirement,
  onChange,
}: {
  requirement: RequirementRecord;
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const references = requirement.figmaReferences ?? [];

  async function attach() {
    if (!url.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await requirementsApi.attachFigmaLink(requirement.id, url.trim());
      setUrl("");
      setShowForm(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach Figma link");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(referenceId: string) {
    await requirementsApi.removeFigmaLink(requirement.id, referenceId);
    onChange();
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-dim)]">Figma references ({references.length})</h2>
        <Button size="mini" variant="grey-outline" leftIcon={<Frame size={14} />} onClick={() => setShowForm((v) => !v)}>
          Attach design
        </Button>
      </div>

      {showForm && (
        <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-4">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a Figma file or frame URL"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
          {error && <p className="mt-2 text-xs text-[var(--red)]">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <Button size="mini" variant="grey-outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button size="mini" onClick={attach} disabled={submitting}>
              {submitting ? "Attaching…" : "Attach"}
            </Button>
          </div>
        </div>
      )}

      {references.length === 0 ? (
        <p className="text-sm text-[var(--text-dim)]">No design references attached yet.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {references.map((ref) => (
            <div key={ref.id} className="relative w-40 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)]">
              <IconButton
                icon={<X size={12} />}
                aria-label="Remove Figma reference"
                size="xtiny"
                shape="circle"
                onClick={() => remove(ref.id)}
                className="absolute right-1.5 top-1.5 z-10"
              />
              <a href={ref.url} target="_blank" rel="noopener noreferrer">
                {ref.thumbnailUrl ? (
                  <img src={ref.thumbnailUrl} alt={ref.fileName ?? "Figma file"} className="h-24 w-full object-cover" />
                ) : (
                  <div className="flex h-24 w-full items-center justify-center text-[var(--text-dim)]">
                    <Frame size={20} />
                  </div>
                )}
                <div className="truncate px-2 py-1.5 text-xs text-[var(--text-dim)]">{ref.fileName ?? ref.fileKey}</div>
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
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
        if (!id) throw new Error("Enter a valid PBI id.");
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
    <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-4">
      {mode === "existing" ? (
        <input
          value={adoId}
          onChange={(e) => setAdoId(e.target.value)}
          placeholder="PBI id, e.g. 12345"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title for the new PBI"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      )}
      {error && <p className="mt-2 text-xs text-[var(--red)]">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text)]">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={14} /> {mode === "existing" ? "Link" : "Create & link"}
        </button>
      </div>
    </div>
  );
}
