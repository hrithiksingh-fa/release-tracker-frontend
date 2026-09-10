import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, List, LayoutGrid } from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { requirementsApi, trackersApi } from "../api/resources.js";
import type { RequirementRecord, TrackerRecord, ClientRecord } from "../api/types.js";
import { StageBadge, ReleaseNoteStatusBadge } from "../components/StatusBadge.js";
import { KanbanBoard } from "../components/KanbanBoard.js";

type ViewMode = "list" | "board";

const columnHelper = createColumnHelper<RequirementRecord>();

export function TrackerGridPage() {
  const { trackerId } = useParams<{ trackerId: string }>();
  const navigate = useNavigate();
  const [tracker, setTracker] = useState<(TrackerRecord & { client: ClientRecord }) | null>(null);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<ViewMode>("board");
  const [error, setError] = useState<string | null>(null);

  function reload() {
    if (!trackerId) return;
    trackersApi.get(trackerId).then(setTracker);
    requirementsApi.listForTracker(trackerId).then(setRequirements);
  }

  useEffect(reload, [trackerId]);

  async function addRequirement() {
    if (!trackerId || !newTitle.trim()) return;
    setCreating(true);
    try {
      await requirementsApi.create(trackerId, { title: newTitle.trim() });
      setNewTitle("");
      reload();
    } finally {
      setCreating(false);
    }
  }

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
      columnHelper.accessor((r) => r.stage, {
        id: "stage",
        header: "Stage",
        cell: (info) => {
          const stage = info.getValue();
          return stage ? <StageBadge name={stage.stage.name} color={stage.stage.color} /> : <span className="text-[#9aa1ac]">—</span>;
        },
      }),
      columnHelper.accessor("dueDate", {
        header: "Due",
        cell: (info) => {
          const v = info.getValue();
          return v ? new Date(v).toLocaleDateString() : <span className="text-[#9aa1ac]">—</span>;
        },
      }),
      columnHelper.accessor((r) => r.linkedWorkItems, {
        id: "linkedWorkItems",
        header: "ADO work items",
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
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: requirements,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!tracker) return <div className="p-8 text-sm text-[#9aa1ac]">Loading…</div>;

  const workflowStages = tracker.client.requirementWorkflow?.stages ?? [];

  return (
    <div className="mx-auto max-w-6xl p-8">
      <Link
        to={`/clients/${tracker.clientId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[#9aa1ac] hover:text-white"
      >
        <ArrowLeft size={14} /> {tracker.client.name}
      </Link>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{tracker.name}</h1>
        <ViewToggle view={view} onChange={setView} />
      </div>
      <p className="mb-6 text-sm text-[#9aa1ac]">
        Stages move manually (drag on the board, or from the requirement page). Moving into a "Done"-flagged stage
        generates a release note draft.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e0a13a]/35 bg-[#e0a13a]/10 px-3 py-2 text-sm text-[#e0a13a]">
          {error}
        </p>
      )}

      <div className="mb-4 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New requirement title"
          className="flex-1 rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]"
          onKeyDown={(e) => e.key === "Enter" && addRequirement()}
        />
        <button
          onClick={addRequirement}
          disabled={creating || !newTitle.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-[#5b8cff] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={16} /> Add requirement
        </button>
      </div>

      {view === "board" ? (
        workflowStages.length ? (
          <KanbanBoard
            columns={workflowStages.map((ws) => ({ id: ws.id, title: ws.stage.name, color: ws.stage.color }))}
            items={requirements}
            getColumnId={(r) => r.stageId}
            onMove={moveRequirementStage}
            renderCard={(r) => (
              <div onClick={() => navigate(`/requirements/${r.id}`)}>
                <div className="text-sm font-medium text-white">{r.title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#9aa1ac]">
                  {r.dueDate && <span>Due {new Date(r.dueDate).toLocaleDateString()}</span>}
                  {r.linkedWorkItems.length > 0 && <span>{r.linkedWorkItems.length} linked</span>}
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
              {requirements.length === 0 && (
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
