import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, List, LayoutGrid } from "lucide-react";
import { clientsApi, workflowsApi } from "../api/resources.js";
import type { ClientRecord, WorkflowRecord } from "../api/types.js";
import { KanbanBoard } from "../components/KanbanBoard.js";
import { StageBadge } from "../components/StatusBadge.js";

type ViewMode = "list" | "board";

export function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [projectWorkflow, setProjectWorkflow] = useState<WorkflowRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("board");
  const navigate = useNavigate();

  function reload() {
    setLoading(true);
    Promise.all([clientsApi.list(), workflowsApi.list("PROJECT")])
      .then(([clientList, workflows]) => {
        setClients(clientList);
        setProjectWorkflow(workflows[0] ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function moveClientStage(clientId: string, workflowStageId: string) {
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, currentStageId: workflowStageId } : c)));
    try {
      await clientsApi.moveStage(clientId, workflowStageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move client");
      reload();
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#5b8cff] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus size={16} /> New client
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-[#e05a5a]">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#9aa1ac]">Loading…</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-[#9aa1ac]">No clients yet. Create one to get started.</p>
      ) : view === "list" ? (
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
              <div className="flex items-center gap-3">
                {c.currentStage && <StageBadge name={c.currentStage.stage.name} color={c.currentStage.stage.color} />}
                <span
                  className={
                    c.adoPatConfigured
                      ? "text-xs font-medium text-[#33c17a]"
                      : "text-xs font-medium text-[#9aa1ac]"
                  }
                >
                  {c.adoPatConfigured ? "ADO connected" : "ADO not connected"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : projectWorkflow ? (
        <KanbanBoard
          columns={projectWorkflow.stages.map((ws) => ({ id: ws.id, title: ws.stage.name, color: ws.stage.color }))}
          items={clients}
          getColumnId={(c) => c.currentStageId}
          onMove={moveClientStage}
          renderCard={(c) => (
            <div onClick={() => navigate(`/clients/${c.id}`)}>
              <div className="text-sm font-medium text-white">{c.name}</div>
              <div className="mt-1 text-xs text-[#9aa1ac]">
                {c.slackChannelName ? `#${c.slackChannelName}` : "No Slack"} · {c.adoProject ?? "No ADO"}
              </div>
            </div>
          )}
        />
      ) : (
        <p className="text-sm text-[#e05a5a]">No PROJECT workflow found. Run the seed script on the backend.</p>
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

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-[#2a2f3a]">
      <button
        onClick={() => onChange("board")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${
          view === "board" ? "bg-[#5b8cff]/15 text-[#5b8cff]" : "text-[#9aa1ac] hover:text-white"
        }`}
      >
        <LayoutGrid size={14} /> Board
      </button>
      <button
        onClick={() => onChange("list")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${
          view === "list" ? "bg-[#5b8cff]/15 text-[#5b8cff]" : "text-[#9aa1ac] hover:text-white"
        }`}
      >
        <List size={14} /> List
      </button>
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
        <p className="mb-4 text-xs text-[#9aa1ac]">
          Starts on the first stage of the Projects board. Its own requirement workflow is cloned from the default
          template automatically.
        </p>
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
