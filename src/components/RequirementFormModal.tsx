import { useEffect, useState, type ReactNode } from "react";
import { requirementsApi, modulesApi, categoriesApi } from "../api/resources.js";
import type { RequirementRecord, ModuleRecord, CategoryRecord } from "../api/types.js";

type PbiMode = "none" | "existing" | "new";

// Shared by PhaseDetailPage (create) and RequirementDetailPage (edit).
// Creation only: the PBI-attach section, since only one PBI can be
// created/linked at creation time -- more can be added afterward from the
// detail page's existing "Link existing / Create PBI" actions, which do
// support multiple.
export function RequirementFormModal({
  requirement,
  phaseId,
  phaseDeliveryDate,
  onClose,
  onSaved,
}: {
  requirement?: RequirementRecord;
  phaseId: string;
  phaseDeliveryDate?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(requirement);
  const [title, setTitle] = useState(requirement?.title ?? "");
  const [description, setDescription] = useState(requirement?.description ?? "");
  const [priority, setPriority] = useState(requirement?.priority ?? 5);
  const [moduleId, setModuleId] = useState(requirement?.moduleId ?? "");
  const [categoryId, setCategoryId] = useState(requirement?.categoryId ?? "");
  const [productOwner, setProductOwner] = useState(requirement?.productOwner ?? "");
  const [deliveryDate, setDeliveryDate] = useState(
    requirement?.deliveryDate?.slice(0, 10) ?? phaseDeliveryDate?.slice(0, 10) ?? ""
  );
  const [asanaLink, setAsanaLink] = useState(requirement?.asanaLink ?? "");
  const [figmaLink, setFigmaLink] = useState("");
  const [releaseNotesText, setReleaseNotesText] = useState(requirement?.releaseNotesText ?? "");
  const [generalRemarks, setGeneralRemarks] = useState(requirement?.generalRemarks ?? "");

  const [pbiMode, setPbiMode] = useState<PbiMode>("none");
  const [pbiAdoId, setPbiAdoId] = useState("");
  const [pbiTitle, setPbiTitle] = useState("");
  const [pbiDescription, setPbiDescription] = useState("");

  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    modulesApi.list().then(setModules);
    categoriesApi.list().then(setCategories);
  }, []);

  async function submit() {
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        moduleId: moduleId || undefined,
        categoryId: categoryId || undefined,
        productOwner: productOwner.trim() || undefined,
        asanaLink: asanaLink.trim() || undefined,
        releaseNotesText: releaseNotesText.trim() || undefined,
        generalRemarks: generalRemarks.trim() || undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
      };

      if (isEdit && requirement) {
        await requirementsApi.update(requirement.id, payload);
      } else {
        const created = await requirementsApi.create(phaseId, payload);
        if (pbiMode === "existing" && pbiAdoId.trim()) {
          await requirementsApi.linkExisting(created.id, Number(pbiAdoId.trim()));
        } else if (pbiMode === "new" && pbiTitle.trim()) {
          await requirementsApi.createInAdo(created.id, {
            title: pbiTitle.trim(),
            description: pbiDescription.trim() || undefined,
          });
        }
        if (figmaLink.trim()) {
          await requirementsApi.attachFigmaLink(created.id, figmaLink.trim());
        }
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save requirement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--text)]">{isEdit ? "Edit requirement" : "New requirement"}</h2>
        <div className="flex flex-col gap-3">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Module">
              <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className={inputClass}>
                <option value="">None</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Product owner">
              <input value={productOwner} onChange={(e) => setProductOwner(e.target.value)} className={inputClass} placeholder="Name" />
            </Field>
            <Field label="Priority">
              <select value={priority} onChange={(e) => setPriority(Number(e.target.value))} className={inputClass}>
                {Array.from({ length: 11 }, (_, p) => (
                  <option key={p} value={p}>
                    P{p} {p === 0 ? "(highest)" : p === 10 ? "(lowest)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Delivery date">
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          {!isEdit && (
            <Field label="Azure DevOps PBI">
              <div className="flex flex-col gap-2">
                <div className="flex gap-3 text-xs text-[var(--text-dim)]">
                  {(["none", "existing", "new"] as PbiMode[]).map((m) => (
                    <label key={m} className="flex items-center gap-1.5">
                      <input type="radio" name="pbiMode" checked={pbiMode === m} onChange={() => setPbiMode(m)} />
                      {m === "none" ? "Leave blank" : m === "existing" ? "Link existing" : "Create new"}
                    </label>
                  ))}
                </div>
                {pbiMode === "existing" && (
                  <input
                    value={pbiAdoId}
                    onChange={(e) => setPbiAdoId(e.target.value)}
                    placeholder="PBI id, e.g. 12345"
                    className={inputClass}
                  />
                )}
                {pbiMode === "new" && (
                  <>
                    <input
                      value={pbiTitle}
                      onChange={(e) => setPbiTitle(e.target.value)}
                      placeholder="Title for the new PBI"
                      className={inputClass}
                    />
                    <textarea
                      value={pbiDescription}
                      onChange={(e) => setPbiDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className={inputClass}
                    />
                  </>
                )}
              </div>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Asana link">
              <input value={asanaLink} onChange={(e) => setAsanaLink(e.target.value)} className={inputClass} placeholder="https://app.asana.com/..." />
            </Field>
            {!isEdit && (
              <Field label="Figma link">
                <input value={figmaLink} onChange={(e) => setFigmaLink(e.target.value)} className={inputClass} placeholder="https://figma.com/..." />
              </Field>
            )}
          </div>

          <Field label="Release notes">
            <textarea value={releaseNotesText} onChange={(e) => setReleaseNotesText(e.target.value)} rows={2} className={inputClass} placeholder="Supplementary note, separate from the auto-generated release note" />
          </Field>
          <Field label="General remarks">
            <textarea value={generalRemarks} onChange={(e) => setGeneralRemarks(e.target.value)} rows={2} className={inputClass} />
          </Field>
        </div>

        {error && <p className="mt-3 text-sm text-[var(--red)]">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !title.trim()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--text-dim)]">{label}</span>
      {children}
    </label>
  );
}
