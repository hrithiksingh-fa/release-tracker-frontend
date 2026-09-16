import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LayoutGrid, List, Pencil, Plus } from "lucide-react";
import { clientsApi, phasesApi } from "../api/resources.js";
import type { ClientRecord, PhaseRecord } from "../api/types.js";
import { KanbanBoard } from "../components/KanbanBoard.js";
import { StageBadge } from "../components/StatusBadge.js";
import { ClientFormModal } from "../components/ClientFormModal.js";
import { TimelineButton, TimelinePanel } from "../components/Timeline.js";

type ViewMode = "list" | "board";

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [phases, setPhases] = useState<PhaseRecord[]>([]);
  const [view, setView] = useState<ViewMode>("board");
  const [showCreatePhase, setShowCreatePhase] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    if (!clientId) return;
    clientsApi.get(clientId).then(setClient);
    phasesApi.listForClient(clientId).then(setPhases);
  }

  useEffect(reload, [clientId]);

  async function movePhaseStage(phaseId: string, workflowStageId: string) {
    setPhases((prev) => prev.map((p) => (p.id === phaseId ? { ...p, stageId: workflowStageId } : p)));
    try {
      await phasesApi.moveStage(phaseId, workflowStageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move phase");
      reload();
    }
  }

  if (!client) return <div className="p-8 text-sm text-[#9aa1ac]">Loading…</div>;

  const phaseStages = client.phaseWorkflow?.stages ?? [];

  return (
    <div className="mx-auto max-w-6xl p-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-[#9aa1ac] hover:text-white">
        <ArrowLeft size={14} /> All clients
      </Link>

      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{client.name}</h1>
          {client.currentStage && <StageBadge name={client.currentStage.stage.name} color={client.currentStage.stage.color} />}
        </div>
        <div className="flex gap-2">
          <TimelineButton onClick={() => setShowTimeline(true)} />
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#2a2f3a] px-3 py-1.5 text-xs font-medium text-[#9aa1ac] hover:border-[#5b8cff] hover:text-white"
          >
            <Pencil size={14} /> Edit
          </button>
        </div>
      </div>
      {client.description && <p className="mb-2 text-sm text-[#9aa1ac]">{client.description}</p>}
      <p className="mb-6 text-sm text-[#9aa1ac]">
        {client.productOwner ? `Owner: ${client.productOwner}` : "No product owner"} ·{" "}
        {client.slackChannelName ? `Slack: #${client.slackChannelName}` : "No Slack channel"} ·{" "}
        {client.adoProjectUrl ? `ADO: ${client.adoProjectUrl}` : "ADO not configured"}
        {client.deliveryDate && <> · Delivery: {new Date(client.deliveryDate).toLocaleDateString()}</>}
      </p>
      {client.modules && client.modules.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {client.modules.map((m) => (
            <span key={m.id} className="rounded-full border border-[#2a2f3a] px-2.5 py-0.5 text-xs text-[#9aa1ac]">
              {m.name}
            </span>
          ))}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#9aa1ac]">Phases</h2>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <button
            onClick={() => setShowCreatePhase(true)}
            className="flex items-center gap-1 rounded-lg bg-[#5b8cff] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus size={14} /> Add phase
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e0a13a]/35 bg-[#e0a13a]/10 px-3 py-2 text-sm text-[#e0a13a]">
          {error}
        </p>
      )}

      {phases.length === 0 ? (
        <p className="text-sm text-[#9aa1ac]">No phases yet for this client.</p>
      ) : view === "list" ? (
        <div className="divide-y divide-[#2a2f3a] rounded-xl border border-[#2a2f3a] bg-[#171a21]">
          {phases.map((p) => (
            <Link
              key={p.id}
              to={`/phases/${p.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
            >
              <div>
                <span className="font-medium text-white">{p.name}</span>
                {p.deliveryDate && (
                  <span className="ml-2 text-xs text-[#9aa1ac]">Due {new Date(p.deliveryDate).toLocaleDateString()}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {p.stage && <StageBadge name={p.stage.stage.name} color={p.stage.stage.color} />}
                <span className="text-xs text-[#9aa1ac]">{p._count?.requirements ?? 0} requirement(s)</span>
              </div>
            </Link>
          ))}
        </div>
      ) : phaseStages.length ? (
        <KanbanBoard
          columns={phaseStages.map((ws) => ({ id: ws.id, title: ws.stage.name, color: ws.stage.color }))}
          items={phases}
          getColumnId={(p) => p.stageId}
          onMove={movePhaseStage}
          renderCard={(p) => (
            <div onClick={() => navigate(`/phases/${p.id}`)}>
              <div className="text-sm font-medium text-white">{p.name}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#9aa1ac]">
                {p.deliveryDate && <span>Due {new Date(p.deliveryDate).toLocaleDateString()}</span>}
                <span>{p._count?.requirements ?? 0} req.</span>
              </div>
            </div>
          )}
        />
      ) : (
        <p className="text-sm text-[#e05a5a]">This client has no phase workflow configured.</p>
      )}

      {showCreatePhase && (
        <CreatePhaseModal
          clientId={client.id}
          onClose={() => setShowCreatePhase(false)}
          onCreated={() => {
            setShowCreatePhase(false);
            reload();
          }}
        />
      )}
      {showEdit && (
        <ClientFormModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            reload();
          }}
        />
      )}
      {showTimeline && <TimelinePanel entityType="client" entityId={client.id} onClose={() => setShowTimeline(false)} />}
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

function CreatePhaseModal({
  clientId,
  onClose,
  onCreated,
}: {
  clientId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await phasesApi.create(clientId, {
        name: name.trim(),
        description: description.trim() || undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create phase");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2a2f3a] bg-[#171a21] p-6">
        <h2 className="mb-4 text-base font-semibold text-white">New phase</h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#9aa1ac]">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Onboarding, Scaling 1"
              className="rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#9aa1ac]">What this phase is about</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#9aa1ac]">Delivery date</span>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]"
              style={{ colorScheme: "dark" }}
            />
          </label>
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
