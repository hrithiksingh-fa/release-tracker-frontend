import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, List, LayoutGrid, Pencil } from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { requirementsApi, phasesApi } from "../api/resources.js";
import type { RequirementRecord, PhaseRecord, ClientRecord } from "../api/types.js";
import { StageBadge, ReleaseNoteStatusBadge, PriorityBadge } from "../components/StatusBadge.js";
import { KanbanBoard } from "../components/KanbanBoard.js";
import { TimelineButton, TimelinePanel } from "../components/Timeline.js";
import { RequirementFormModal } from "../components/RequirementFormModal.js";

type ViewMode = "list" | "board";

const columnHelper = createColumnHelper<RequirementRecord>();

export function PhaseDetailPage() {
  const { phaseId } = useParams<{ phaseId: string }>();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<(PhaseRecord & { client: ClientRecord }) | null>(null);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [view, setView] = useState<ViewMode>("board");
  const [error, setError] = useState<string | null>(null);
  const [showEditPhase, setShowEditPhase] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showAddRequirement, setShowAddRequirement] = useState(false);
  const [showNotFeasible, setShowNotFeasible] = useState(false);

  function reload() {
    if (!phaseId) return;
    phasesApi.get(phaseId).then(setPhase);
    requirementsApi.listForPhase(phaseId).then(setRequirements);
  }

  useEffect(reload, [phaseId]);

  const visibleRequirements = showNotFeasible
    ? requirements
    : requirements.filter((r) => r.category?.showByDefault !== false);

  async function moveRequirementStage(requirementId: string, workflowStageId: string) {
    setRequirements((prev) =>
      prev.map((r) => (r.id === requirementId ? { ...r, stageId: workflowStageId } : r))
    );
    try {
      const result = await requirementsApi.moveStage(requirementId, workflowStageId);
      if (result.releaseNoteWarning) setError(result.releaseNoteWarning);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move requirement");
      reload();
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Requirement",
        cell: (info) => <span className="font-medium text-white">{info.getValue()}</span>,
      }),
      columnHelper.accessor("priority", {
        header: "Priority",
        cell: (info) => <PriorityBadge priority={info.getValue()} />,
      }),
      columnHelper.accessor((r) => r.stage, {
        id: "stage",
        header: "Stage",
        cell: (info) => {
          const stage = info.getValue();
          return stage ? <StageBadge name={stage.stage.name} color={stage.stage.color} /> : <span className="text-[#9aa1ac]">—</span>;
        },
      }),
      columnHelper.accessor("deliveryDate", {
        header: "Delivery",
        cell: (info) => {
          const v = info.getValue();
          return v ? new Date(v).toLocaleDateString() : <span className="text-[#9aa1ac]">—</span>;
        },
      }),
      columnHelper.accessor((r) => r.category, {
        id: "category",
        header: "Category",
        cell: (info) => info.getValue()?.name ?? <span className="text-[#9aa1ac]">—</span>,
      }),
      columnHelper.accessor((r) => r.linkedWorkItems, {
        id: "linkedWorkItems",
        header: "PBIs",
        cell: (info) => {
          const items = info.getValue();
          if (!items.length) return <span className="text-[#9aa1ac]">None linked</span>;
          return (
            <span className="text-[#9aa1ac]">
              {items.map((li) => `#${li.adoId} (${li.adoState ?? "?"})`).join(", ")}
            </span>
          );
        },
      }),
      columnHelper.accessor((r) => r.releaseNotes?.[0], {
        id: "releaseNote",
        header: "Release note",
        cell: (info) => {
          const note = info.getValue();
          return note ? <ReleaseNoteStatusBadge status={note.status} /> : <span className="text-[#9aa1ac]">—</span>;
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: visibleRequirements,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!phase) return <div className="p-8 text-sm text-[#9aa1ac]">Loading…</div>;

  const workflowStages = phase.client.requirementWorkflow?.stages ?? [];

  return (
    <div className="mx-auto max-w-6xl p-8">
      <Link
        to={`/clients/${phase.clientId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[#9aa1ac] hover:text-white"
      >
        <ArrowLeft size={14} /> {phase.client.name}
      </Link>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{phase.name}</h1>
        <div className="flex items-center gap-2">
          <TimelineButton onClick={() => setShowTimeline(true)} />
          <button
            onClick={() => setShowEditPhase(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#2a2f3a] px-3 py-1.5 text-xs font-medium text-[#9aa1ac] hover:border-[#5b8cff] hover:text-white"
          >
            <Pencil size={14} /> Edit
          </button>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>
      {phase.description && <p className="mb-2 text-sm text-[#9aa1ac]">{phase.description}</p>}
      <p className="mb-6 text-sm text-[#9aa1ac]">
        {phase.deliveryDate && <>Delivery: {new Date(phase.deliveryDate).toLocaleDateString()} · </>}
        Stages move manually (drag on the board, or from the requirement page). Moving into a "Done"-flagged stage
        generates a release note draft.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e0a13a]/35 bg-[#e0a13a]/10 px-3 py-2 text-sm text-[#e0a13a]">
          {error}
        </p>
      )}

      <div className="mb-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-[#9aa1ac]">
          <input type="checkbox" checked={showNotFeasible} onChange={(e) => setShowNotFeasible(e.target.checked)} />
          Show not feasible
        </label>
        <button
          onClick={() => setShowAddRequirement(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#5b8cff] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={16} /> New requirement
        </button>
      </div>

      {view === "board" ? (
        workflowStages.length ? (
          <KanbanBoard
            columns={workflowStages.map((ws) => ({ id: ws.id, title: ws.stage.name, color: ws.stage.color }))}
            items={visibleRequirements}
            getColumnId={(r) => r.stageId}
            onMove={moveRequirementStage}
            renderCard={(r) => (
              <div onClick={() => navigate(`/requirements/${r.id}`)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-white">{r.title}</div>
                  <PriorityBadge priority={r.priority} />
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#9aa1ac]">
                  {r.deliveryDate && <span>Due {new Date(r.deliveryDate).toLocaleDateString()}</span>}
                  {r.linkedWorkItems.length > 0 && <span>{r.linkedWorkItems.length} PBI(s)</span>}
                </div>
              </div>
            )}
          />
        ) : (
          <p className="text-sm text-[#e05a5a]">This client has no requirement workflow configured.</p>
        )
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#2a2f3a] bg-[#171a21]">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-[#2a2f3a]">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9aa1ac]"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/requirements/${row.original.id}`)}
                  className="cursor-pointer border-b border-[#2a2f3a] last:border-0 hover:bg-white/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {visibleRequirements.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-[#9aa1ac]">
                    No requirements yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEditPhase && (
        <EditPhaseModal
          phase={phase}
          onClose={() => setShowEditPhase(false)}
          onSaved={() => {
            setShowEditPhase(false);
            reload();
          }}
        />
      )}
      {showTimeline && <TimelinePanel entityType="phase" entityId={phase.id} onClose={() => setShowTimeline(false)} />}
      {showAddRequirement && (
        <RequirementFormModal
          phaseId={phase.id}
          phaseDeliveryDate={phase.deliveryDate}
          onClose={() => setShowAddRequirement(false)}
          onSaved={() => {
            setShowAddRequirement(false);
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

function EditPhaseModal({
  phase,
  onClose,
  onSaved,
}: {
  phase: PhaseRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(phase.name);
  const [description, setDescription] = useState(phase.description ?? "");
  const [deliveryDate, setDeliveryDate] = useState(phase.deliveryDate?.slice(0, 10) ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await phasesApi.update(phase.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save phase");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2a2f3a] bg-[#171a21] p-6">
        <h2 className="mb-4 text-base font-semibold text-white">Edit phase</h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#9aa1ac]">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#9aa1ac]">What this phase is about</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#9aa1ac]">Delivery date</span>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]" style={{ colorScheme: "dark" }} />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-[#e05a5a]">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-[#9aa1ac] hover:text-white">
            Cancel
          </button>
          <button onClick={submit} disabled={submitting || !name.trim()} className="rounded-lg bg-[#5b8cff] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
