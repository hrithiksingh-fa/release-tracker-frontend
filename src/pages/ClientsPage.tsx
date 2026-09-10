import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { clientsApi } from "../api/resources.js";
import type { ClientRecord } from "../api/types.js";

export function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    setLoading(true);
    clientsApi
      .list()
      .then(setClients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#5b8cff] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={16} /> New client
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-[#e05a5a]">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#9aa1ac]">Loading…</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-[#9aa1ac]">No clients yet. Create one to get started.</p>
      ) : (
        <div className="divide-y divide-[#2a2f3a] rounded-xl border border-[#2a2f3a] bg-[#171a21]">
          {clients.map((c) => (
            <Link
              key={c.id}
              to={`/clients/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
            >
              <div>
                <div className="font-medium text-white">{c.name}</div>
                <div className="mt-0.5 text-xs text-[#9aa1ac]">
                  {c.slackChannelName ? `#${c.slackChannelName}` : "No Slack channel"} ·{" "}
                  {c.adoProject ?? "No ADO project"}
                </div>
              </div>
              <span
                className={
                  c.adoPatConfigured
                    ? "text-xs font-medium text-[#33c17a]"
                    : "text-xs font-medium text-[#9aa1ac]"
                }
              >
                {c.adoPatConfigured ? "ADO connected" : "ADO not connected"}
              </span>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateClientModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function CreateClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [slackChannelId, setSlackChannelId] = useState("");
  const [slackChannelName, setSlackChannelName] = useState("");
  const [adoOrgUrl, setAdoOrgUrl] = useState("");
  const [adoProject, setAdoProject] = useState("");
  const [adoAreaPath, setAdoAreaPath] = useState("");
  const [adoPat, setAdoPat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await clientsApi.create({
        name: name.trim(),
        slackChannelId: slackChannelId.trim() || undefined,
        slackChannelName: slackChannelName.trim() || undefined,
        adoOrgUrl: adoOrgUrl.trim() || undefined,
        adoProject: adoProject.trim() || undefined,
        adoAreaPath: adoAreaPath.trim() || undefined,
        adoPat: adoPat.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2a2f3a] bg-[#171a21] p-6">
        <h2 className="mb-4 text-base font-semibold text-white">New client</h2>
        <div className="flex flex-col gap-3">
          <Field label="Client name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
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
          <Field label="ADO PAT">
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
            {submitting ? "Creating…" : "Create"}
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
