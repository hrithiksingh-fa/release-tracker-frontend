import { useEffect, useState, type ReactNode } from "react";
import { clientsApi, modulesApi } from "../api/resources.js";
import type { ClientRecord, ModuleRecord } from "../api/types.js";

// Shared by ClientsPage (create) and ClientDetailPage (edit) so the large
// form isn't duplicated. Pass `client` to edit it in place; omit it to create.
export function ClientFormModal({
  client,
  onClose,
  onSaved,
}: {
  client?: ClientRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(client);
  const [name, setName] = useState(client?.name ?? "");
  const [description, setDescription] = useState(client?.description ?? "");
  const [productOwner, setProductOwner] = useState(client?.productOwner ?? "");
  const [deliveryDate, setDeliveryDate] = useState(client?.deliveryDate?.slice(0, 10) ?? "");
  const [slackChannelId, setSlackChannelId] = useState(client?.slackChannelId ?? "");
  const [slackChannelName, setSlackChannelName] = useState(client?.slackChannelName ?? "");
  const [adoOrgUrl, setAdoOrgUrl] = useState(client?.adoOrgUrl ?? "");
  const [adoProject, setAdoProject] = useState(client?.adoProject ?? "");
  const [adoAreaPath, setAdoAreaPath] = useState(client?.adoAreaPath ?? "");
  const [adoPat, setAdoPat] = useState("");
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(
    new Set(client?.modules?.map((m) => m.id) ?? [])
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    modulesApi.list().then(setModules);
  }, []);

  function toggleModule(id: string) {
    setSelectedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        productOwner: productOwner.trim() || undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        slackChannelId: slackChannelId.trim() || undefined,
        slackChannelName: slackChannelName.trim() || undefined,
        adoOrgUrl: adoOrgUrl.trim() || undefined,
        adoProject: adoProject.trim() || undefined,
        adoAreaPath: adoAreaPath.trim() || undefined,
        adoPat: adoPat.trim() || undefined,
        moduleIds: Array.from(selectedModuleIds),
      };
      if (isEdit && client) {
        await clientsApi.update(client.id, payload);
      } else {
        await clientsApi.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[#2a2f3a] bg-[#171a21] p-6">
        <h2 className="mb-4 text-base font-semibold text-white">{isEdit ? "Edit client" : "New client"}</h2>
        {!isEdit && (
          <p className="mb-4 text-xs text-[#9aa1ac]">
            Starts on the first stage of the Projects board. Its own phase and requirement workflows are cloned from
            the default templates automatically.
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Field label="Client name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Product owner">
              <input value={productOwner} onChange={(e) => setProductOwner(e.target.value)} className={inputClass} placeholder="Name" />
            </Field>
            <Field label="Delivery date">
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputClass} style={{ colorScheme: "dark" }} />
            </Field>
          </div>

          <Field label="Modules used">
            <div className="flex flex-wrap gap-2">
              {modules.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleModule(m.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selectedModuleIds.has(m.id)
                      ? "border-[#5b8cff] bg-[#5b8cff]/15 text-[#5b8cff]"
                      : "border-[#2a2f3a] text-[#9aa1ac] hover:text-white"
                  }`}
                >
                  {m.name}
                </button>
              ))}
              {modules.length === 0 && <span className="text-xs text-[#9aa1ac]">None defined yet — add some in Settings → Modules.</span>}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Slack channel ID">
              <input value={slackChannelId} onChange={(e) => setSlackChannelId(e.target.value)} className={inputClass} placeholder="C0123ABCD" />
            </Field>
            <Field label="Slack channel name">
              <input value={slackChannelName} onChange={(e) => setSlackChannelName(e.target.value)} className={inputClass} placeholder="acme-releases" />
            </Field>
          </div>
          <Field label="ADO org URL">
            <input value={adoOrgUrl} onChange={(e) => setAdoOrgUrl(e.target.value)} className={inputClass} placeholder="https://dev.azure.com/myorg" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ADO project">
              <input value={adoProject} onChange={(e) => setAdoProject(e.target.value)} className={inputClass} />
            </Field>
            <Field label="ADO area path">
              <input value={adoAreaPath} onChange={(e) => setAdoAreaPath(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label={isEdit ? "ADO PAT (leave blank to keep current)" : "ADO PAT"}>
            <input type="password" value={adoPat} onChange={(e) => setAdoPat(e.target.value)} className={inputClass} />
          </Field>
        </div>

        {error && <p className="mt-3 text-sm text-[#e05a5a]">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-[#9aa1ac] hover:text-white">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !name.trim()}
            className="rounded-lg bg-[#5b8cff] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[#9aa1ac]">{label}</span>
      {children}
    </label>
  );
}
