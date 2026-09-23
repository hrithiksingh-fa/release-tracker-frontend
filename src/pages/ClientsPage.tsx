import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, List, LayoutGrid } from "lucide-react";
import { clientsApi, workflowsApi } from "../api/resources.js";
import type { ClientRecord, WorkflowRecord } from "../api/types.js";
import { KanbanBoard } from "../components/KanbanBoard.js";
import { StageBadge } from "../components/StatusBadge.js";
import { ClientFormModal } from "../components/ClientFormModal.js";

type ViewMode = "list" | "board";

export function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientWorkflow, setClientWorkflow] = useState<WorkflowRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("board");
  const navigate = useNavigate();

  function reload() {
    setLoading(true);
    Promise.all([clientsApi.list(), workflowsApi.list("CLIENT")])
      .then(([clientList, workflows]) => {
        setClients(clientList);
        setClientWorkflow(workflows[0] ?? null);
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
            className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus size={16} /> New client
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-[var(--red)]">{error}</p>}
      {loading ? (
        <p className="text-sm text-[var(--text-dim)]">Loading…</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-[var(--text-dim)]">No clients yet. Create one to get started.</p>
      ) : view === "list" ? (
        <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--panel)]">
          {clients.map((c) => (
            <Link
              key={c.id}
              to={`/clients/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-[var(--hover-surface)]"
            >
              <div>
                <div className="font-medium text-[var(--text)]">{c.name}</div>
                <div className="mt-0.5 text-xs text-[var(--text-dim)]">
                  {c.productOwner ? `Owner: ${c.productOwner}` : "No product owner"} ·{" "}
                  {c.slackChannelName ? `#${c.slackChannelName}` : "No Slack channel"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {c.currentStage && <StageBadge name={c.currentStage.stage.name} color={c.currentStage.stage.color} />}
                <span
                  className={
                    c.adoPatConfigured
                      ? "text-xs font-medium text-[var(--green)]"
                      : "text-xs font-medium text-[var(--text-dim)]"
                  }
                >
                  {c.adoPatConfigured ? "ADO connected" : "ADO not connected"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : clientWorkflow ? (
        <KanbanBoard
          columns={clientWorkflow.stages.map((ws) => ({ id: ws.id, title: ws.stage.name, color: ws.stage.color }))}
          items={clients}
          getColumnId={(c) => c.currentStageId}
          onMove={moveClientStage}
          renderCard={(c) => (
            <div onClick={() => navigate(`/clients/${c.id}`)}>
              <div className="text-sm font-medium text-[var(--text)]">{c.name}</div>
              <div className="mt-1 text-xs text-[var(--text-dim)]">
                {c.productOwner ?? "No owner"} · {c.slackChannelName ? `#${c.slackChannelName}` : "No Slack"}
              </div>
            </div>
          )}
        />
      ) : (
        <p className="text-sm text-[var(--red)]">No CLIENT workflow found. Run the seed script on the backend.</p>
      )}

      {showCreate && (
        <ClientFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
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
    <div className="flex overflow-hidden rounded-lg border border-[var(--border)]">
      <button
        onClick={() => onChange("board")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${
          view === "board" ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "text-[var(--text-dim)] hover:text-[var(--text)]"
        }`}
      >
        <LayoutGrid size={14} /> Board
      </button>
      <button
        onClick={() => onChange("list")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${
          view === "list" ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "text-[var(--text-dim)] hover:text-[var(--text)]"
        }`}
      >
        <List size={14} /> List
      </button>
    </div>
  );
}
